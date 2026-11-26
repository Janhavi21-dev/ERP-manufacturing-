import React from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './redux/store';
import AppRouter from './app/router';

export default function App() {
  return (
    <Provider store={store}>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </Provider>
  );
}
