import { Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import UIDemo from '../pages/UIDemo';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/ui-demo" element={<UIDemo />} />
    </Routes>
  );
}
