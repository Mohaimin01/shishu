"""Generate Shishu icon PNGs from the logo geometry (mirrors public/icons/icon.svg)."""
import cairo
import math
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "apps", "web", "public", "icons")

BG = (0xF7 / 255, 0xF5 / 255, 0xF0 / 255)
PRIMARY = (0x6B / 255, 0x90 / 255, 0x80 / 255)
PRIMARY_DARK = (0x4F / 255, 0x70 / 255, 0x64 / 255)
ACCENT = (0xD4 / 255, 0xA3 / 255, 0x73 / 255)
SECONDARY = (0xC9 / 255, 0xA9 / 255, 0xA6 / 255)


def rounded_rect(cr, x, y, w, h, r):
    cr.new_sub_path()
    cr.arc(x + w - r, y + r, r, -0.5 * math.pi, 0)
    cr.arc(x + w - r, y + h - r, r, 0, 0.5 * math.pi)
    cr.arc(x + r, y + h - r, r, 0.5 * math.pi, math.pi)
    cr.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    cr.close_path()


def draw_sprout(cr, cx, cy, scale):
    cr.save()
    cr.translate(cx, cy)
    cr.scale(scale, scale)
    # stem
    cr.set_source_rgb(*PRIMARY_DARK)
    cr.set_line_width(20)
    cr.set_line_cap(cairo.LineCap.ROUND)
    cr.move_to(0, 96)
    cr.curve_to(0, 40, 0, 10, 0, -6)
    cr.stroke()
    # left leaf
    cr.set_source_rgb(*PRIMARY)
    cr.move_to(-8, 30)
    cr.curve_to(-74, 24, -108, -10, -110, -58)
    cr.curve_to(-58, -52, -22, -14, -8, 30)
    cr.close_path()
    cr.fill()
    # right leaf
    cr.move_to(8, -18)
    cr.curve_to(66, -30, 96, -66, 96, -110)
    cr.curve_to(48, -100, 18, -62, 8, -18)
    cr.close_path()
    cr.fill()
    # pot
    cr.set_source_rgb(*ACCENT)
    cr.move_to(-64, 96)
    cr.line_to(64, 96)
    cr.line_to(44, 172)
    cr.line_to(22, 188)
    cr.line_to(-22, 188)
    cr.line_to(-44, 172)
    cr.close_path()
    cr.fill()
    cr.restore()


def draw_star(cr, x, y, scale):
    cr.save()
    cr.translate(x, y)
    cr.scale(scale, scale)
    cr.set_source_rgb(*SECONDARY)
    cr.move_to(0, -38)
    cr.line_to(10, -11)
    cr.line_to(38, 0)
    cr.line_to(10, 11)
    cr.line_to(0, 38)
    cr.line_to(-10, 11)
    cr.line_to(-38, 0)
    cr.line_to(-10, -11)
    cr.close_path()
    cr.fill()
    cr.restore()


def render(size, mode, dest):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    cr = cairo.Context(surf)
    s = size / 512
    if mode == "maskable":
        cr.set_source_rgb(*BG)
        cr.rectangle(0, 0, size, size)
        cr.fill()
        cr.translate(size / 2, size / 2)
        cr.scale(0.76 * s, 0.76 * s)
        cr.translate(-256, -300 + 60)
    else:
        rounded_rect(cr, 0, 0, size, size, 112 * s)
        cr.set_source_rgb(*BG)
        cr.fill()
        cr.scale(s, s)
    draw_sprout(cr, 256, 300, 1)
    draw_star(cr, 390, 128, 0.72)
    surf.write_to_png(dest)
    print("wrote", dest)


render(512, "any", os.path.join(OUT, "icon-512.png"))
render(192, "any", os.path.join(OUT, "icon-192.png"))
render(180, "any", os.path.join(OUT, "apple-touch-icon.png"))
render(96, "any", os.path.join(OUT, "favicon-96.png"))
render(512, "maskable", os.path.join(OUT, "icon-512-maskable.png"))
