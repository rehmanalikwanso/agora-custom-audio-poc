import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { VideoCallAgent } from './Pages/Agent';
import { VideoCallClient } from './Pages/Customer';

function App() {
  return (
    <Router >
       <Routes>
        <Route path={'/'} element={<VideoCallAgent/>} />
        <Route path={'/customer'} element={<VideoCallClient/>} />
      </Routes>
    </Router>
  );
}

export default App;
