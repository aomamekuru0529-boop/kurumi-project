export class Music {
  constructor(url) { this.url=url; this.enabled=false; this.context=null; this.timer=null; this.note=0; this.audio=null; }
  async setEnabled(enabled) {
    this.stop(); this.enabled=enabled;
    if (!enabled || document.hidden) return;
    if (this.url) {
      this.audio ||= new Audio(this.url); this.audio.loop=true; this.audio.volume=.25;
      try { await this.audio.play(); } catch (error) { this.enabled=false; throw error; }
      return;
    }
    const Context=window.AudioContext || window.webkitAudioContext;
    if (!Context) { this.enabled=false; throw new Error('Audio unavailable'); }
    this.context ||= new Context();
    await this.context.resume();
    const notes=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5,880,783.99,659.25,587.33];
    const play=()=>{
      const t=this.context.currentTime, o=this.context.createOscillator(), g=this.context.createGain();
      o.type='sine';o.frequency.value=notes[this.note++%notes.length];
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+1.8);
      o.connect(g);g.connect(this.context.destination);o.start(t);o.stop(t+1.9);
      o.onended=()=>{o.disconnect();g.disconnect()};
    };
    play(); this.timer=setInterval(play,700);
  }
  stop() { clearInterval(this.timer);this.timer=null;this.audio?.pause();if(this.context?.state==='running')void this.context.suspend(); }
}
