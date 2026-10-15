import React,{useId,useRef} from 'react';
import {useAmbient} from './motion.jsx';
import art from './tab-scenes.json';

export const tabSettings={
  trips:{cell:0,label:'A Swiss railway platform with a red train and vintage luggage'},
  map:{cell:1,label:'A cartographer’s studio with an atlas, compass and globe'},
  packing:{cell:2,label:'An Alpine lakeshore with wildflowers, a wooden jetty and a travel backpack'},
  tasks:{cell:3,label:'A flower-filled courtyard with a wooden quest noticeboard'},
  budget:{cell:4,label:'A cozy travel-money desk with a ledger and gold coins'},
  bookings:{cell:5,label:'A vintage station ticket office with passports and travel documents'},
  ski:{cell:6,label:'A snowy ski village with a chalet and a gondola cable car'},
  journal:{cell:7,label:'A lakeside cafe with a travel journal, camera and tea'},
  settings:{cell:8,label:'A sunlit attic studio with a wardrobe and plants'}
};

export function TabScene({scene,motion=true}){
  const ref=useRef(null),active=useAmbient(ref,motion),clipId=useId(),setting=tabSettings[scene],single=art.overrides?.[scene],image=single||art,columns=single?1:3,cell=single?0:setting.cell,width=image.width/columns,height=image.height/(single?1:3),x=cell%columns*width,y=Math.floor(cell/columns)*height;
  return <div ref={ref} className={`page-setting setting-${scene}`} data-scene={scene} data-paused={!active} role="img" aria-label={setting.label}><svg className="setting-art" viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height}/></clipPath></defs><image href={image.url} width={image.width} height={image.height} clipPath={`url(#${clipId})`}/></svg><div className="setting-light" aria-hidden="true"/><div className="setting-motes" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} style={{left:`${12+i*11}%`,top:`${22+i*19%65}%`,'--mote':i}}/>)}</div></div>;
}
