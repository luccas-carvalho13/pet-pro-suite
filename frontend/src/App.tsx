import { AppProviders } from "./app/providers/app-providers";
import { AppRouter } from "./app/router/app-router";

const App = () => (
  <AppProviders>
    <AppRouter />
  </AppProviders>
);

export default App;

