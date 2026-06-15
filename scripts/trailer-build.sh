#!/usr/bin/env bash
# Assembles the ~30s trailer: title card, interactive lab clip (real cursor +
# packet animation), OSI animation, feature stills with Ken Burns + captions,
# crossfades, outro card, and a royalty-free music bed.
set -e
T=/tmp/trailer
cd "$T"

# Still scene: slow zoom + lower-third caption. args: img cap secs out
still_scene () {
  local img="$1" cap="$2" secs="$3" out="$4"
  local frames=$(awk "BEGIN{printf \"%d\", $secs*25}")
  ffmpeg -y -loglevel error -i "$img" -i "$cap" -filter_complex \
    "[0:v]scale=3840:2160,setsar=1,zoompan=z='min(zoom+0.0006,1.10)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25[bg];[bg][1:v]overlay=0:0,format=yuv420p[v]" \
    -map "[v]" -r 25 -c:v libx264 -crf 20 -preset medium "$out"
  echo "built $out"
}

# Video scene: trim a window from a webm + caption. args: webm seekIn secs cap out
video_scene () {
  local src="$1" seek="$2" secs="$3" cap="$4" out="$5"
  ffmpeg -y -loglevel error -ss "$seek" -i "$src" -i "$cap" -filter_complex \
    "[0:v]trim=0:${secs},setpts=PTS-STARTPTS,scale=1920:1080,setsar=1,fps=25[bg];[bg][1:v]overlay=0:0,format=yuv420p[v]" \
    -map "[v]" -t "$secs" -r 25 -c:v libx264 -crf 20 "$out"
  echo "built $out"
}

# Title (fade in)
ffmpeg -y -loglevel error -loop 1 -t 3 -i title.png \
  -vf "scale=1920:1080,setsar=1,fps=25,fade=t=in:st=0:d=0.4,format=yuv420p" \
  -r 25 -c:v libx264 -crf 20 s1.mp4 && echo "built s1 title"

video_scene lab.webm 2.0 8 cap_lab.png s2.mp4         # interactive lab: cursor + packets
still_scene osi-still.png     cap_osi.png          4   s3.mp4   # OSI model (static)
video_scene match.webm 1.5 6 cap_match.png s4.mp4    # Match game working
still_scene troubleshoot.png cap_troubleshoot.png 3.5 s5.mp4
still_scene mobile_scene.png cap_mobile.png       3.5 s6.mp4

# Outro (fade out)
ffmpeg -y -loglevel error -loop 1 -t 4.5 -i outro.png \
  -vf "scale=1920:1080,setsar=1,fps=25,fade=t=out:st=4.0:d=0.5,format=yuv420p" \
  -r 25 -c:v libx264 -crf 20 s7.mp4 && echo "built s7 outro"

# Crossfade-chain (offsets account for each 0.5s overlap)
ffmpeg -y -loglevel error -i s1.mp4 -i s2.mp4 -i s3.mp4 -i s4.mp4 -i s5.mp4 -i s6.mp4 -i s7.mp4 \
  -filter_complex \
  "[0][1]xfade=transition=fade:duration=0.5:offset=2.5[a];\
   [a][2]xfade=transition=fade:duration=0.5:offset=10.0[b];\
   [b][3]xfade=transition=fade:duration=0.5:offset=13.5[c];\
   [c][4]xfade=transition=fade:duration=0.5:offset=19.0[d];\
   [d][5]xfade=transition=fade:duration=0.5:offset=22.0[e];\
   [e][6]xfade=transition=fade:duration=0.5:offset=25.0[v]" \
  -map "[v]" -r 25 -c:v libx264 -crf 19 -pix_fmt yuv420p -movflags +faststart silent.mp4
echo "built silent master (~29s)"

# Music bed: seek into the track for a developed section, trim, fade in/out.
ffmpeg -y -loglevel error -i silent.mp4 -ss 20 -i horizon.m4a -filter_complex \
  "[1:a]atrim=0:29.5,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.7,afade=t=out:st=27.8:d=1.7,volume=0.9[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest netlab-trailer.mp4
echo "TRAILER -> $T/netlab-trailer.mp4"
