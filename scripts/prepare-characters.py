"""Optimize untouched sprite sources and measure SVG viewports for registration."""
from pathlib import Path
from PIL import Image
import json
import sys
from collections import deque
root=Path(__file__).resolve().parents[1]
grids={'blonde-actions':(4,3),'brunette-actions':(4,3),'blonde-wardrobe':(3,2),'brunette-wardrobe':(3,2),'companions':(3,4)}
data={}
for name,(cols,rows) in grids.items():
    source=root/'source-art'/'characters'/f'{name}.png'
    if not source.exists():continue
    with Image.open(source) as im:
        w,h=im.size;alpha=im.getchannel('A');bounds=[]
        for index in range(cols*rows):
            x=round(index%cols*w/cols);y=round(index//cols*h/rows)
            x2=round((index%cols+1)*w/cols);y2=round((index//cols+1)*h/rows)
            box=alpha.crop((x,y,x2,y2)).point(lambda p:255 if p>170 else 0).getbbox()
            if not box:raise ValueError(f'Empty sprite {name}:{index}')
            left,top,right,bottom=box
            bounds.append([max(x,x+left-2),max(y,y+top-2),min(x2,x+right+2)-max(x,x+left-2),min(y2,y+bottom+2)-max(y,y+top-2)])
        # Generated sheets have uneven spacing; identify actual connected figures.
        # This only measures viewports. Source and delivery pixels stay untouched.
        mask=bytearray(alpha.point(lambda p:255 if p>170 else 0).tobytes());components=[]
        for start in range(w*h):
            if not mask[start]:continue
            mask[start]=0;queue=deque([start]);area=0;left=w;right=0;top=h;bottom=0
            while queue:
                index=queue.popleft();x=index%w;y=index//w;area+=1
                left=min(left,x);right=max(right,x);top=min(top,y);bottom=max(bottom,y)
                neighbors=[]
                if x:neighbors.append(index-1)
                if x<w-1:neighbors.append(index+1)
                if y:neighbors.append(index-w)
                if y<h-1:neighbors.append(index+w)
                for neighbor in neighbors:
                    if mask[neighbor]:mask[neighbor]=0;queue.append(neighbor)
            if area>500:components.append((area,[max(0,left-2),max(0,top-2),min(w,right+3)-max(0,left-2),min(h,bottom+3)-max(0,top-2)]))
        figures=sorted(components,reverse=True)[:cols*rows]
        if len(figures)==cols*rows:
            figures.sort(key=lambda item:item[1][1]+item[1][3]/2)
            bounds=[]
            for row in range(rows):bounds.extend(box for _,box in sorted(figures[row*cols:(row+1)*cols],key=lambda item:item[1][0]))
        else:print('Warning: using regular grid for',name,len(figures))
        target=root/'dist'/'assets'/'characters'/f'{name}.webp'
        if '--bounds-only' not in sys.argv or not target.exists():im.save(target,'WEBP',quality=93,method=6)
        data[name]={'url':f'/assets/characters/{name}.webp','width':w,'height':h,'bounds':bounds}
        print(name,target.stat().st_size,'bytes')
(root/'src'/'character-atlas.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
