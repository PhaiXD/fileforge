import io
from PIL import Image

img = Image.new('RGB', (1000, 500), color = 'red')
buffer = io.BytesIO()
img.save(buffer, format='ICO')
print("Successfully saved as ICO!")
