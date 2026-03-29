#!/bin/bash
# Batch compress and resize postcard images for web
# Usage: ./scripts/compress-images.sh /path/to/source/folder
#
# Resizes images to max 800px wide, JPEG quality 80
# Outputs to postcards/ folder with sequential naming

SOURCE="$1"
DEST="postcards"

if [ -z "$SOURCE" ]; then
  echo "Usage: ./scripts/compress-images.sh /path/to/source/folder"
  exit 1
fi

if [ ! -d "$SOURCE" ]; then
  echo "Error: Source folder not found: $SOURCE"
  exit 1
fi

mkdir -p "$DEST"

# Get current highest number in postcards folder
LAST=$(ls "$DEST"/*.jpg 2>/dev/null | sort -V | tail -1 | grep -o '[0-9]\+' | tail -1)
COUNT=${LAST:-0}

echo "Starting compression from $SOURCE..."
echo "Output: $DEST/"
echo ""

for file in "$SOURCE"/*.{jpg,jpeg,png,JPG,JPEG,PNG,tiff,TIFF}; do
  [ -f "$file" ] || continue
  COUNT=$((COUNT + 1))
  NUM=$(printf "%03d" $COUNT)
  OUTFILE="$DEST/$NUM.jpg"

  # Copy and convert to JPEG
  cp "$file" "$OUTFILE.tmp"

  # Resize to max 800px wide (preserves aspect ratio)
  sips --resampleWidth 800 "$OUTFILE.tmp" --setProperty format jpeg --setProperty formatOptions 80 --out "$OUTFILE" >/dev/null 2>&1

  # Clean up temp
  rm -f "$OUTFILE.tmp"

  # Get final file size
  SIZE=$(du -h "$OUTFILE" | cut -f1)
  echo "  $NUM.jpg ($SIZE) <- $(basename "$file")"
done

echo ""
echo "Done! Compressed $COUNT images to $DEST/"
echo ""
echo "Next step: Add entries to data/postcards.json"
echo "Template:"
echo '  {"id":"001","title":"...","reference":"...","date":"c. 19XX","era":"...","image":"postcards/001.jpg"}'
