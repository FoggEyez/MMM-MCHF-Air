const NodeHelper=require('node_helper'),M=require('./conditions-model.js');
module.exports=NodeHelper.create({
 start(){this.started=false;this.stopped=false;this.air=null;this.alerts=null;this.airAttempt=0;this.alertAttempt=0;},
 socketNotificationReceived(name,config){if(name!=='CONDITIONS_START'||config?.locationConfigured!==true)return;if(config.latitude===null||config.longitude===null||config.latitude===''||config.longitude==='')return;const lat=Number(config?.latitude),lon=Number(config?.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return;
  if(this.started){this.sendSocketNotification('CONDITIONS_DATA',{air:this.air,alerts:this.alerts});return;}
  this.latitude=lat;this.longitude=lon;this.started=true;this.refresh();},
 async get(url){const r=await fetch(url,{headers:{'User-Agent':'MirrorMischief/1.0 (personal local conditions display)','Accept':'application/geo+json,application/json,text/plain'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Provider unavailable');const text=await r.text();if(text.length>3000000)throw Error('Feed too large');return text;},
 async refresh(){const now=Date.now();await Promise.allSettled([
  (async()=>{if(now-this.airAttempt<900000)return;this.airAttempt=now;const text=await this.get('https://files.airnowtech.org/airnow/today/reportingarea.dat');this.air={fetchedAt:Date.now(),reading:M.airnow(text,this.latitude,this.longitude)};})(),
  (async()=>{if(now-this.alertAttempt<120000)return;this.alertAttempt=now;const text=await this.get(`https://api.weather.gov/alerts/active?point=${this.latitude.toFixed(5)},${this.longitude.toFixed(5)}`);this.alerts={checkedAt:Date.now(),items:M.alerts(JSON.parse(text))};})()
 ]);if(!this.stopped){this.sendSocketNotification('CONDITIONS_DATA',{air:this.air,alerts:this.alerts});this.timer=setTimeout(()=>this.refresh(),30000);}},
 stop(){this.stopped=true;clearTimeout(this.timer);}
});
