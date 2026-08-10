from typing import List


class RecursiveCharacterTextSplitter:
    """
    Algorithmic text splitter that recursively segments a document string
    into smaller, overlapping chunks. It prioritizes splits on semantic
    boundaries like paragraphs (\n\n), sentences (\n), and words (space).
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        # Ordered list of separators from most semantic to least semantic
        self.separators = ["\n\n", "\n", " ", ""]

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        # Base case: text is already within the target size limit
        if len(text) <= self.chunk_size:
            return [text]

        # Base case: no more separators to try, split by hard limit
        if not separators:
            return [
                text[i : i + self.chunk_size]
                for i in range(0, len(text), self.chunk_size)
            ]

        separator = separators[0]
        next_separators = separators[1:]

        # Split text by current separator
        if separator == "":
            # Hard character split fallback
            return [
                text[i : i + self.chunk_size]
                for i in range(0, len(text), self.chunk_size)
            ]

        splits = text.split(separator)

        chunks = []
        current_chunk: List[str] = []
        current_len = 0

        for split in splits:
            # If an individual segment is larger than chunk_size, split it recursively
            if len(split) > self.chunk_size:
                # Flush the current accumulator first
                if current_chunk:
                    chunks.append(separator.join(current_chunk))
                    current_chunk = []
                    current_len = 0

                # Run recursion using next level separators (e.g. split paragraph by sentences)
                sub_splits = self._split_text(split, next_separators)
                chunks.extend(sub_splits)
            else:
                # Check if adding this segment would exceed the limit
                sep_len = len(separator) if current_chunk else 0
                if current_len + sep_len + len(split) > self.chunk_size:
                    # Flush the current chunk
                    if current_chunk:
                        chunks.append(separator.join(current_chunk))

                    # Calculate sliding window overlap
                    overlap_chunk: List[str] = []
                    overlap_len = 0
                    # Traverse backwards to collect suffix items that fit within the overlap window
                    for item in reversed(current_chunk):
                        item_sep_len = len(separator) if overlap_chunk else 0
                        if (
                            overlap_len + item_sep_len + len(item)
                            <= self.chunk_overlap
                        ):
                            overlap_chunk.insert(0, item)
                            overlap_len += item_sep_len + len(item)
                        else:
                            break
                    current_chunk = overlap_chunk
                    current_len = overlap_len

                # Append current split
                sep_len = len(separator) if current_chunk else 0
                current_chunk.append(split)
                current_len += sep_len + len(split)

        # Flush any remaining items in the buffer
        if current_chunk:
            chunks.append(separator.join(current_chunk))

        return chunks

    def split_text(self, text: str) -> List[str]:
        """
        Public entrypoint to split a text string into overlapping chunks.
        """
        # Clean text carriage returns first
        clean_text = text.replace("\r\n", "\n")
        return self._split_text(clean_text, self.separators)
