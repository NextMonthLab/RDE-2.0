import { Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/toaster'
import RDEPage from './pages/RDEPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/" component={RDEPage} />
        <Route component={NotFoundPage} />
      </Switch>
      <Toaster />
    </div>
  )
}

export default App