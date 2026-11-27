import sys, shutil, pathlib, re
V=sys.argv[1]
root=pathlib.Path(__file__).resolve().parent.parent; gen=root/'tools'
t=(gen/'index.template.html').read_text(encoding='utf-8')
scene=(gen/'out/hero_scene.svg.part').read_text(encoding='utf-8')
(root/'index.html').write_text(t.replace('__SCENE__',scene).replace('__V__',V),encoding='utf-8')
for f in (gen/'out/images').glob('*.svg'): shutil.copy(f, root/'images'/f.name)
a=(root/'admin.html').read_text(encoding='utf-8'); a=re.sub(r'\?v=\d+','?v='+V,a); (root/'admin.html').write_text(a,encoding='utf-8')
print('built v',V)
