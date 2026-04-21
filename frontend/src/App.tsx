import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { Dashboard, KnowledgeBase, Playground, SettingsPage } from './pages';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="playground" element={<Playground />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
