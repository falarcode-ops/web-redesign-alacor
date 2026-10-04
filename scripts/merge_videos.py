import os
import subprocess
import imageio_ffmpeg

def main():
    base_dir = r"c:\Users\Acer\Documents\Mis Documetos\Developer\AI\web-redesign-alacor"
    marketing_dir = os.path.join(base_dir, "public", "img", "marketing")
    
    file1 = os.path.join(marketing_dir, "video_hero_alacor_backup.mp4") # Heights video
    file2 = os.path.join(marketing_dir, "Wan_Video_Generate_Cinematic slow dolly-in camera movement. Extremely subtle and.mp4") # Team speaking video
    file3 = os.path.join(marketing_dir, "Wan_Video_Reference_@Image1 A cinematic, smooth drone-shot video starting from t.mp4") # Drone solar panel video
    
    # If backup heights doesn't exist, try falling back to standard video
    if not os.path.exists(file1):
        file1 = os.path.join(marketing_dir, "video_hero_alacor.mp4")
        
    print(f"Clip 1: {file1}")
    print(f"Clip 2: {file2}")
    print(f"Clip 3: {file3}")
    
    # Find precompiled ffmpeg executable path from imageio_ffmpeg library
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"Using embedded FFmpeg binary: {ffmpeg_exe}")
    
    output_file = os.path.join(marketing_dir, "video_hero_alacor_merged_3way.mp4")
    
    # We construct a high-performance, memory-safe filter_complex command.
    # It scales each video to fit perfectly in 1280x720, padding with black bars
    # to maintain the original aspect ratio exactly without stretching or cropping.
    filter_complex_str = (
        "[0:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v0]; "
        "[1:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v1]; "
        "[2:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v2]; "
        "[v0][v1][v2]concat=n=3:v=1:a=0[v]"
    )
    
    cmd = [
        ffmpeg_exe,
        "-y", # Overwrite output file
        "-i", file1,
        "-i", file2,
        "-i", file3,
        "-filter_complex", filter_complex_str,
        "-map", "[v]",
        "-an", # Remove audio stream for silent background loop
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22", # Premium visual quality with great compression
        output_file
    ]
    
    print("Executing native FFmpeg video assembly...")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    if result.returncode == 0:
        print("FFmpeg video assembly completed successfully!")
        
        # Safely replace active hero video
        active_hero_video = os.path.join(marketing_dir, "video_hero_alacor.mp4")
        backup_file = os.path.join(marketing_dir, "video_hero_alacor_backup.mp4")
        
        # Ensure original backup exists
        if not os.path.exists(backup_file) and os.path.exists(active_hero_video):
            os.rename(active_hero_video, backup_file)
            print(f"Original video backed up to: {backup_file}")
        else:
            if os.path.exists(active_hero_video):
                try:
                    os.remove(active_hero_video)
                    print("Removed old merged video.")
                except Exception as e:
                    print(f"Warning: Could not remove active file (might be open): {e}")
                    
        try:
            os.rename(output_file, active_hero_video)
            print("Successfully created the high-end 3-way merged background loop!")
        except Exception as e:
            print(f"Error renaming final clip: {e}")
    else:
        print("FFmpeg assembly failed!")
        print(f"Stderr: {result.stderr}")

if __name__ == "__main__":
    main()
