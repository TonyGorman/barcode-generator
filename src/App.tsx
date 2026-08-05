import LabelApp from './components/LabelApp'
import './App.css'

function App() {
  return (
    <>
      <a className="skipLink" href="#main-content">
        Skip to main content
      </a>
      <main id="main-content">
        <LabelApp />
      </main>
    </>
  )
}

export default App
