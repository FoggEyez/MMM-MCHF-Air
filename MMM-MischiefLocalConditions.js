/* global Module,LocalConditionsModel */
Module.register('MMM-MischiefLocalConditions',{
 requiresVersion:'2.38.0',
 defaults:{latitude:0,longitude:0,locationConfigured:false,timeZone:'',panelWidth:350,showSmokeAdvisories:true,showObservedTime:true,maxAlerts:3},
 getScripts(){return [this.file('conditions-model.js')];},getStyles(){return [this.file('MMM-MischiefLocalConditions.css')];},
 start(){this.snapshot=null;this.sendSocketNotification('CONDITIONS_START',this.config);this.timer=setInterval(()=>this.updateDom(0),60000);},
 socketNotificationReceived(name,data){if(name==='CONDITIONS_DATA'){if(this.snapshot?.air?.fetchedAt===data?.air?.fetchedAt&&this.snapshot?.alerts?.checkedAt===data?.alerts?.checkedAt)return;this.snapshot=data;this.updateDom(0);}},
 suspend(){clearInterval(this.timer);},resume(){clearInterval(this.timer);this.timer=setInterval(()=>this.updateDom(0),60000);this.sendSocketNotification('CONDITIONS_START',this.config);},
 el(tag,cls,text){const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;return e;},
 getDom(){const root=this.el('section','lc-card'),now=Date.now(),air=this.snapshot?.air,reading=air?.reading,alerts=this.snapshot?.alerts,airFresh=reading&&now-reading.observedAt<10800000&&reading.observedAt<now+1800000,alertsFresh=alerts&&now-alerts.checkedAt<600000&&alerts.checkedAt<now+30000;
  root.style.width=Math.min(500,Math.max(260,Number(this.config.panelWidth)||350))+'px';root.append(this.el('div','lc-heading','MISCHIEF LOCAL CONDITIONS'));if(this.config.locationConfigured!==true){root.append(this.el('div','yellow','Set latitude and longitude, then turn on locationConfigured.'));return root;}
  const summary=this.el('div','lc-summary'),value=this.el('div',airFresh?LocalConditionsModel.level(reading.value):'yellow');value.append(this.el('strong','lc-number',airFresh?String(Math.round(reading.value)):'—'),this.el('span','lc-label',airFresh?' AQI · '+reading.category:' Air quality unavailable'));
  const origin=this.el('div','lc-origin');if(airFresh){origin.append(this.el('div','',reading.area+' · '+Math.round(reading.miles)+' mi away'));if(this.config.showObservedTime!==false)origin.append(this.el('div','','Observed '+new Date(reading.observedAt).toLocaleTimeString('en-US',{timeZone:this.config.timeZone||undefined,hour:'numeric',minute:'2-digit'})));}summary.append(value,origin);root.append(summary);
  if(!alertsFresh)root.append(this.el('div','lc-alert yellow','● Weather alerts unavailable · check NWS'));
  else{const active=alerts.items.filter(a=>a.expires>now);if(!active.length)root.append(this.el('div','lc-alert green','● No active weather alerts'));
   for(const alert of active.slice(0,Math.min(8,Math.max(1,Number(this.config.maxAlerts)||3)))){const item=this.el('div','lc-alert '+(['Extreme','Severe'].includes(alert.severity)?'red':'yellow'),'● '+alert.event);item.title=alert.headline+'\n'+alert.instruction;root.append(item);}
   if(active.length>this.config.maxAlerts)root.append(this.el('div','lc-alert yellow','+'+(active.length-this.config.maxAlerts)+' more alerts · check NWS'));
   if(this.config.showSmokeAdvisories!==false)root.append(this.el('div','lc-smoke',active.some(a=>a.smoke)?'Smoke / air-quality advisory active':'No NWS smoke / air-quality advisory'));
  }
  const credit=this.el('div','lc-credit');credit.append(this.el('span','','AirNow · regional observation / NWS '));const a=this.el('a','','Alerts & details');a.href='https://www.weather.gov/alerts';a.target='_blank';a.rel='noopener noreferrer';credit.append(a);root.append(credit);return root;
 }
});
