import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { Agent } from './Pages/Agent';
import { Customer } from './Pages/Customer';

function App() {
  return (
    <Router >
       <Routes>
        <Route path={'/'} element={<Agent/>} />
        <Route path={'/customer'} element={<Customer/>} />
      </Routes>
    </Router>
  );
}

export default App;
