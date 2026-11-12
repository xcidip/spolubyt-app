import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

const app = createApp(App)
app.config.errorHandler = (error): void => {
  console.error(error)
  const root = document.getElementById('app')
  if (!root) return
  const message = document.createElement('p')
  message.textContent = 'Prototyp se nepodařilo zobrazit. Můžete obnovit výchozí demo data.'
  const reset = document.createElement('button')
  reset.type = 'button'
  reset.textContent = 'Obnovit výchozí data prototypu'
  reset.className = 'p-4 rounded-xl bg-emerald-600 text-white'
  reset.onclick = (): void => {
    if (!window.confirm('Obnovit výchozí data? Vaše úpravy prototypu budou odstraněny.')) return
    localStorage.removeItem('spolubyt_hifi_v2_state')
    window.location.reload()
  }
  root.replaceChildren(message, reset)
}
app.mount('#app')

