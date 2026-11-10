(function(root){
 const finite=n=>typeof n==='number'&&Number.isFinite(n),level=n=>!finite(n)?'yellow':n<=50?'green':n<=100?'yellow':'red';
 const categories=n=>n<=50?'Good':n<=100?'Moderate':n<=150?'Unhealthy for sensitive groups':n<=200?'Unhealthy':n<=300?'Very unhealthy':'Hazardous';
 function airnow(text,lat,lon,now=Date.now()){
  const offsets={PST:-8,PDT:-7,MST:-7,MDT:-6,CST:-6,CDT:-5,EST:-5,EDT:-4},rows=[];
  for(const line of text.split(/\r?\n/)){const p=line.split('|');if(p.length<17||p[5]!=='O'||!p[12].trim()||!(p[3]in offsets))continue;
   const d=p[1].match(/^(\d{2})\/(\d{2})\/(\d{2})$/),t=p[2].match(/^(\d{1,2}):(\d{2})$/);if(!d||!t)continue;
   const at=Date.UTC(2000+Number(d[3]),Number(d[1])-1,Number(d[2]),Number(t[1])-offsets[p[3]],Number(t[2])),value=Number(p[12]),a=Number(p[9]),b=Number(p[10]);
   if(![at,value,a,b].every(Number.isFinite)||value<0||value>500||at>now+1800000||now-at>10800000)continue;
   const D=Math.PI/180,delta=Math.sin((a-lat)*D/2)**2+Math.cos(a*D)*Math.cos(lat*D)*Math.sin((b-lon)*D/2)**2,km=6371*2*Math.atan2(Math.sqrt(delta),Math.sqrt(1-delta));
   if(km<=100)rows.push({area:p[7],state:p[8],value,observedAt:at,pollutant:p[11],miles:km*.621371});
  }
  rows.sort((a,b)=>a.miles-b.miles||b.observedAt-a.observedAt);if(!rows.length)return null;
  const near=rows.filter(r=>r.area===rows[0].area&&r.state===rows[0].state),at=Math.max(...near.map(r=>r.observedAt)),latest=near.filter(r=>r.observedAt===at).sort((a,b)=>b.value-a.value),best=latest[0];
  return {...best,category:categories(best.value),pm25Aqi:latest.find(r=>r.pollutant==='PM2.5')?.value??null};
 }
 function alerts(data,now=Date.now()){
  if(data?.type!=='FeatureCollection'||!Array.isArray(data.features))throw Error('Invalid alert feed');
  return data.features.map(f=>f.properties).filter(p=>p?.status==='Actual'&&['Alert','Update'].includes(p.messageType)&&Number.isFinite(Date.parse(p.expires))&&Date.parse(p.expires)>now).map(p=>({id:String(p.id||p['@id']||p.event).slice(0,200),event:String(p.event||'Weather alert').slice(0,100),headline:String(p.headline||p.event||'Weather alert').slice(0,250),instruction:String(p.instruction||'See the National Weather Service for details.').slice(0,700),severity:p.severity,expires:Date.parse(p.expires),url:'https://www.weather.gov/alerts',smoke:/smoke|air quality/i.test([p.event,p.headline,p.description].join(' '))})).sort((a,b)=>(['Extreme','Severe'].includes(b.severity)?1:0)-(['Extreme','Severe'].includes(a.severity)?1:0));
 }
 const api={airnow,alerts,level,categories};root.LocalConditionsModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
