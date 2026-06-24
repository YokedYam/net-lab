#!/usr/bin/env python3
# Composes a clear, legible LinkedIn thumbnail from the REAL app screenshots
# (no AI image gen, so text/UI stay pixel-sharp). Rendered at 2x for crisp
# display on high-DPI screens. Also exports a 16:9 video cover.
from PIL import Image, ImageDraw, ImageFont, ImageFilter

A = '/tmp/trailer'
S = 2                                   # supersample factor (2x = 2400x1260)
def u(v): return round(v * S)           # scale a layout value
W, H = u(1200), u(630)
NAVY = (11, 18, 32)
PANEL = (20, 28, 46)
TEAL = (52, 211, 153)
WHITE = (236, 241, 248)
GREY = (150, 165, 186)
AB = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
AR = '/System/Library/Fonts/Supplemental/Arial.ttf'
def f(p, s): return ImageFont.truetype(p, u(s))

base = Image.new('RGBA', (W, H), NAVY + (255,))
d = ImageDraw.Draw(base)

for x in range(0, W, u(48)): d.line([(x, 0), (x, H)], fill=(16, 24, 40), width=S)
for y in range(0, H, u(48)): d.line([(0, y), (W, y)], fill=(16, 24, 40), width=S)
def glow(cx, cy, rx, ry, color, blur, a):
    g = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse([u(cx)-u(rx), u(cy)-u(ry), u(cx)+u(rx), u(cy)+u(ry)], fill=color + (a,))
    base.alpha_composite(g.filter(ImageFilter.GaussianBlur(u(blur))))
glow(360, 470, 300, 240, (16, 70, 60), 120, 150)
glow(1010, 360, 260, 300, (20, 50, 90), 130, 140)

def rounded(img, radius):
    img = img.convert('RGBA')
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, img.size[0]-1, img.size[1]-1], radius=radius, fill=255)
    img.putalpha(m)
    return img

def drop_shadow(box, radius, blur=26, a=150, dy=10):
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    x0, y0, x1, y1 = box
    ImageDraw.Draw(sh).rounded_rectangle([x0, y0+u(dy), x1, y1+u(dy)], radius=radius, fill=(0, 0, 0, a))
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(u(blur))))

# ---- Browser hero (left) with the lab topology ----
bx, by, bw = u(60), u(232), u(720)
pad, bar = u(12), u(34)
cw = bw - pad*2
shot = Image.open(f'{A}/lab.png').convert('RGB')
ch = round(cw * shot.height / shot.width)
bh = bar + ch + pad
drop_shadow((bx, by, bx+bw, by+bh), u(16))
win = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
wd = ImageDraw.Draw(win)
wd.rounded_rectangle([0, 0, bw-1, bh-1], radius=u(16), fill=PANEL + (255,))
for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
    wd.ellipse([u(18+i*22), u(11), u(30+i*22), u(23)], fill=c)
win.alpha_composite(rounded(shot.resize((cw, ch), Image.LANCZOS), u(8)), (pad, bar))
base.alpha_composite(win, (bx, by))

# ---- Phone (right) with the mobile screen ----
phone = Image.open(f'{A}/mobile.png').convert('RGB')
pw = u(196)
inset = u(8)
sw = pw - inset*2
sh_ = round(sw * phone.height / phone.width)
phh = sh_ + inset*2
px, py = u(812), u(196)
drop_shadow((px, py, px+pw, py+phh), u(30))
pf = Image.new('RGBA', (pw, phh), (0, 0, 0, 0))
pd = ImageDraw.Draw(pf)
pd.rounded_rectangle([0, 0, pw-1, phh-1], radius=u(30), fill=PANEL + (255,))
pf.alpha_composite(rounded(phone.resize((sw, sh_), Image.LANCZOS), u(22)), (inset, inset))
pd.rounded_rectangle([pw/2-u(26), u(7), pw/2+u(26), u(17)], radius=u(5), fill=(8, 12, 20, 255))
base.alpha_composite(pf, (px, py))

# "now on mobile" pill above the phone
pill = 'now on mobile'
pfont = f(AB, 22)
l, t, r, b = d.textbbox((0, 0), pill, font=pfont)
pwi, phi = r-l, b-t
ppx, ppy = u(18), u(11)
cxp = px + pw/2
d.rounded_rectangle([cxp-(pwi/2+ppx), py-phi-ppy*2-u(14), cxp+(pwi/2+ppx), py-u(14)],
                    radius=(phi+ppy*2)//2, fill=TEAL + (255,))
d.text((cxp-pwi/2, py-phi-ppy-u(14)-t), pill, font=pfont, fill=NAVY)

# ---- Headline block (top-left) ----
d.ellipse([u(62), u(86), u(84), u(108)], fill=TEAL)
d.text((u(96), u(52)), 'Net+ Visual Lab', font=f(AB, 60), fill=WHITE)
d.text((u(64), u(134)), 'A free, visual way to study for CompTIA Network+', font=f(AR, 27), fill=GREY)
d.text((u(64), u(176)), 'Packet lab  ·  OSI model  ·  Troubleshoot  ·  Match', font=f(AB, 23), fill=TEAL)

# ---- Byline (bottom-right) ----
by_txt = 'built by Johnny Nguyen'
byf = f(AB, 22)
l, t, r, b = d.textbbox((0, 0), by_txt, font=byf)
d.text((W-u(60)-(r-l), H-u(44)), by_txt, font=byf, fill=TEAL)

rgb = base.convert('RGB')
rgb.save('/Users/yong/Desktop/Net+ Visual Lab - thumb.png')
print('saved thumb', rgb.size)

# ---- 16:9 video cover, downscaled from the hi-res render (crisp) ----
CW, CH = 1920, 1080
cover = Image.new('RGB', (CW, CH), NAVY)
cd = ImageDraw.Draw(cover)
for x in range(0, CW, 48): cd.line([(x, 0), (x, CH)], fill=(16, 24, 40), width=1)
for y in range(0, CH, 48): cd.line([(0, y), (CW, y)], fill=(16, 24, 40), width=1)
nw = CW; nh = round(rgb.height * CW / rgb.width)
cover.paste(rgb.resize((nw, nh), Image.LANCZOS), ((CW-nw)//2, (CH-nh)//2))
cover.save('/Users/yong/Desktop/Net+ Visual Lab - cover-1080.png')
print('saved cover-1080', cover.size)
