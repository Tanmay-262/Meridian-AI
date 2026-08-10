import torch
from transformers import AutoTokenizer, AutoModel
from typing import List

# Standard sentence-transformers model
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class PyTorchEmbeddings:
    """
    Custom text embedding generator using PyTorch and Hugging Face Transformers.
    Implements tokenization, forward passes, attention-mask mean pooling,
    and L2 normalization for cosine similarity search compatibility.
    """

    def __init__(self):
        # Determine execution hardware (CPU vs GPU)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Load tokenizer and model
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        self.model = AutoModel.from_pretrained(MODEL_NAME).to(self.device)

        # Set model to evaluation mode (disables dropout layers, etc.)
        self.model.eval()

    def _mean_pooling(self, model_output, attention_mask) -> torch.Tensor:
        """
        Calculates the mean representation of token embeddings, taking
        into account the attention mask to ignore padded tokens.
        """
        # First element of model_output contains all token embeddings
        token_embeddings = model_output[0]

        # Expand attention mask dimensions to match token_embeddings [batch_size, seq_len, embedding_dim]
        input_mask_expanded = (
            attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        )

        # Multiply embeddings by the mask to zero out padded tokens
        sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)

        # Count active non-padded tokens (clamp to prevent division by zero)
        sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)

        return sum_embeddings / sum_mask

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Generates vector embeddings for a list of string inputs.
        Returns a list of float lists (dimension 384 for all-MiniLM-L6-v2).
        """
        if not texts:
            return []

        # 1. Tokenize texts and construct input tensors
        # padding=True, truncation=True caps inputs to the model's max limit (512 tokens)
        encoded_input = self.tokenizer(
            texts, padding=True, truncation=True, max_length=512, return_tensors="pt"
        ).to(self.device)

        # 2. Run Forward Pass without tracking gradients (reduces memory usage)
        with torch.no_grad():
            model_output = self.model(**encoded_input)

        # 3. Apply Mean Pooling to calculate sentence representations
        sentence_embeddings = self._mean_pooling(
            model_output, encoded_input["attention_mask"]
        )

        # 4. Perform L2 Normalization
        # Makes the dot product of two vectors equivalent to their Cosine Similarity
        normalized_embeddings = torch.nn.functional.normalize(
            sentence_embeddings, p=2, dim=1
        )

        # Move to CPU and output as lists of floats
        return normalized_embeddings.cpu().tolist()

    def embed_query(self, text: str) -> List[float]:
        """
        Utility function to generate a vector embedding for a single search query.
        """
        embeddings = self.embed_texts([text])
        return embeddings[0] if embeddings else []


# Singleton instance to avoid loading model weights multiple times
embeddings_encoder = PyTorchEmbeddings()
