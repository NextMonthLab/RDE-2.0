import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to RDE v2.0</h1>
        <p>Resident Development Environment</p>
        <button 
          onClick={() => alert('Hello from RDE!')}
          className="btn-primary"
        >
          Test Button
        </button>
      </header>
    </div>
  )
}

export default App
