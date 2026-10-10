import argparse
import asyncio
import sys
import os
from pathlib import Path

# Add project root to sys.path so we can import services
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(project_root))

from services.video_service import convert_media
from services.media_service import download_media

async def main():
    parser = argparse.ArgumentParser(description="Media Tools")
    parser.add_argument("tool")
    parser.add_argument("input", help="Input file path or URL")
    parser.add_argument("output", help="Output file path")
    
    args = parser.parse_args()
    
    try:
        if args.tool == "yt-mp4":
            file_path, _ = await download_media(args.input, "mp4")
            # Move downloaded file to output path
            os.replace(file_path, args.output)
            print(f"Downloaded to {args.output}")
        elif args.tool == "yt-mp3":
            file_path, _ = await download_media(args.input, "mp3")
            os.replace(file_path, args.output)
            print(f"Downloaded to {args.output}")
        elif args.tool == "tiktok-mp4":
            file_path, _ = await download_media(args.input, "mp4")
            os.replace(file_path, args.output)
            print(f"Downloaded to {args.output}")
        elif args.tool == "tiktok-mp3":
            file_path, _ = await download_media(args.input, "mp3")
            os.replace(file_path, args.output)
            print(f"Downloaded to {args.output}")
        elif args.tool == "to-mp4":
            output_path, _ = await convert_media(args.input, "mp4", Path(args.input).name)
            os.replace(output_path, args.output)
            print(f"Converted to {args.output}")
        elif args.tool == "to-mp3":
            output_path, _ = await convert_media(args.input, "mp3", Path(args.input).name)
            os.replace(output_path, args.output)
            print(f"Converted to {args.output}")
        elif args.tool == "to-m4a":
            output_path, _ = await convert_media(args.input, "m4a", Path(args.input).name)
            os.replace(output_path, args.output)
            print(f"Converted to {args.output}")
        elif args.tool == "to-gif":
            output_path, _ = await convert_media(args.input, "gif", Path(args.input).name)
            os.replace(output_path, args.output)
            print(f"Converted to {args.output}")
        else:
            print(f"Unknown tool: {args.tool}", file=sys.stderr)
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
