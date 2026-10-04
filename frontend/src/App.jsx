import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import WalletPage from "./pages/WalletPage";

import DashboardPage from "./pages/DashboardPage";

import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";

import BatchesPage from "./pages/BatchesPage";
import BatchDetailsPage from "./pages/BatchDetailsPage";

import TransferPage from "./pages/TransferPage";
import RecallPage from "./pages/RecallPage";

import HistoryPage from "./pages/HistoryPage";

import VerifyPage from "./pages/VerifyPage";

import OrganizationsPage from "./pages/OrganizationsPage";
import TransactionsPage from "./pages/TransactionsPage";

import NotFoundPage from "./pages/NotFoundPage";

export default function App() {

  return (

    <Routes>

      {/* PUBLIC */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/wallet"
        element={<WalletPage />}
      />

      <Route
        path="/verify/:batchId"
        element={<VerifyPage />}
      />

      {/* ADMIN */}

      <Route
        path="/app/admin"
        element={
          <DashboardPage role="admin" />
        }
      />

      <Route
        path="/app/admin/organizations"
        element={
          <OrganizationsPage />
        }
      />

      <Route
        path="/app/admin/transactions"
        element={
          <TransactionsPage />
        }
      />

      {/* MANUFACTURER */}

      <Route
        path="/app/manufacturer"
        element={
          <DashboardPage
            role="manufacturer"
          />
        }
      />

      {/* DISTRIBUTOR */}

      <Route
        path="/app/distributor"
        element={
          <DashboardPage
            role="distributor"
          />
        }
      />

      {/* RETAILER */}

      <Route
        path="/app/retailer"
        element={
          <DashboardPage
            role="retailer"
          />
        }
      />

      {/* PRODUCTS */}

      <Route
        path="/app/products"
        element={
          <ProductsPage />
        }
      />

      <Route
        path="/app/products/:id"
        element={
          <ProductDetailsPage />
        }
      />

      {/* BATCHES */}

      <Route
        path="/app/batches"
        element={
          <BatchesPage />
        }
      />

      <Route
        path="/app/batches/:id"
        element={
          <BatchDetailsPage />
        }
      />

      {/* SUPPLY CHAIN */}

      <Route
        path="/app/transfer"
        element={
          <TransferPage />
        }
      />

      <Route
        path="/app/recall"
        element={
          <RecallPage />
        }
      />

      <Route
        path="/app/history"
        element={
          <HistoryPage />
        }
      />

      {/* DEFAULT */}

      <Route
        path="/app"
        element={
          <Navigate
            to="/app/manufacturer"
            replace
          />
        }
      />

      {/* 404 */}

      <Route
        path="*"
        element={<NotFoundPage />}
      />

    </Routes>
  );
}