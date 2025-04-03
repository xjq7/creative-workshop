import { createBrowserRouter } from 'react-router';
import Editor from './pages/editor';
import Content from './pages/content';

const router = createBrowserRouter([
  {
    path: '/editor',
    element: <Editor />,
  },
  {
    path: '/content',
    element: <Content />,
  },
]);

export { router };
