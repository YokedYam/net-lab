#!/usr/bin/env python3
# Builds the trailer's generated frames: title card, outro card, a centered
# mobile scene, and transparent lower-third caption overlays. Brand palette
# matches the app (navy / teal / blue).
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = '/tmp/trailer'
W, H = 1920, 1080
NAVY = (11, 18, 32)
TEAL = (52, 211, 153)
BLUE = (59, 130, 246)
WHITE = (235, 240, 248)
GREY = (148, 163, 184)

AB = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
AR = '/System/Library/Fonts/Supplemental/Arial.ttf'
def f(path, sz): return ImageFont.truetype(path, sz)

def bg(grid=True, glow=None):
    im = Image.new('RGB', (W, H), NAVY)
    d = ImageDraw.Draw(im)
    if grid:
        for x in range(0, W, 60):
            d.line([(x, 0), (x, H)], fill=(18, 26, 44), width=1)
        for y in range(0, H, 60):
            d.line([(0, y), (W, y)], fill=(18, 26, 44), width=1)
    if glow:
        g = Image.new('RGB', (W, H), NAVY)
        gd = ImageDraw.Draw(g)
        gd.ellipse([W//2-520, H//2-360, W//2+520, H//2+360], fill=glow)
        g = g.filter(ImageFilter.GaussianBlur(220))
        im = Image.blend(im, g, 0.45)
    return im

def center_text(d, cx, y, text, font, fill):
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    d.text((cx - (r - l) / 2, y), text, font=font, fill=fill)
    return b - t

# ---- Title card ----
im = bg(grid=True, glow=(8, 40, 36))
d = ImageDraw.Draw(im)
# teal dot + product name, centered as a unit
name = 'Net+ Visual Lab'
nf = f(AB, 120)
l, t, r, b = d.textbbox((0, 0), name, font=nf)
tw = r - l
dot_r = 18
total = dot_r * 2 + 28 + tw
x0 = (W - total) / 2
cy = 430
d.ellipse([x0, cy + 50 - dot_r, x0 + dot_r * 2, cy + 50 + dot_r], fill=TEAL)
d.text((x0 + dot_r * 2 + 28, cy), name, font=nf, fill=WHITE)
center_text(d, W/2, cy + 150, 'learn networking by seeing it move', f(AR, 44), GREY)
center_text(d, W/2, cy + 225, 'A free study tool for CompTIA Network+', f(AB, 34), TEAL)
im.save(f'{OUT}/title.png')

# ---- Outro card ----
im = bg(grid=True, glow=(8, 30, 50))
d = ImageDraw.Draw(im)
center_text(d, W/2, 300, 'Net+ Visual Lab', f(AB, 96), WHITE)
center_text(d, W/2, 430, 'Free. No signup. Works on your phone.', f(AR, 46), GREY)
# CTA pill
cta = 'Try it now'
cf = f(AB, 40)
l, t, r, b = d.textbbox((0, 0), cta, font=cf)
cw, ch = r - l, b - t
px, py = 40, 24
bx0 = (W - (cw + px*2)) / 2
by0 = 560
d.rounded_rectangle([bx0, by0, bx0 + cw + px*2, by0 + ch + py*2], radius=(ch+py*2)//2, fill=TEAL)
d.text((bx0 + px, by0 + py - t), cta, font=cf, fill=NAVY)
center_text(d, W/2, 700, 'built by Johnny Nguyen', f(AB, 40), TEAL)
center_text(d, W/2, 760, 'johnnynguyen.cloud', f(AR, 36), GREY)
im.save(f'{OUT}/outro.png')

# ---- Mobile scene (portrait shot centered on navy) ----
im = bg(grid=True, glow=(8, 36, 40))
phone = Image.open(f'{OUT}/mobile.png').convert('RGB')
scale = (H - 120) / phone.height
nw, nh = int(phone.width * scale), int(phone.height * scale)
phone = phone.resize((nw, nh), Image.LANCZOS)
im.paste(phone, ((W - nw)//2, (H - nh)//2))
im.save(f'{OUT}/mobile_scene.png')

# ---- Caption overlays (transparent, lower third) ----
caps = {
    'cap_lab': 'Build a network and watch the packets flow',
    'cap_osi': 'Watch a packet move through all 7 OSI layers',
    'cap_match': 'Race the clock on ports, protocols and layers',
    'cap_troubleshoot': "Practice CompTIA's 7-step method",
    'cap_mobile': 'Now on mobile. Study anywhere.',
}
cf = f(AB, 50)
for name, text in caps.items():
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    l, t, r, b = d.textbbox((0, 0), text, font=cf)
    tw, th = r - l, b - t
    px, py = 44, 26
    bw, bh = tw + px*2 + 22, th + py*2
    bx0 = (W - bw) / 2
    by0 = 905
    # translucent navy pill with a teal accent block on the left
    d.rounded_rectangle([bx0, by0, bx0+bw, by0+bh], radius=bh//2, fill=(11, 18, 32, 220))
    d.rounded_rectangle([bx0+14, by0+18, bx0+24, by0+bh-18], radius=5, fill=TEAL)
    d.text((bx0 + 40, by0 + py - t), text, font=cf, fill=WHITE)
    ov.save(f'{OUT}/{name}.png')

print('cards + captions written to', OUT)
