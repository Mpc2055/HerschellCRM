import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "./lib/auth";
import { Loader } from "@/components/ui/loader"; 

// Layout components
import Layout from "@/components/layout/layout";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import MemberDetail from "@/pages/member-detail";
import NewMember from "@/pages/new-member";
import MembershipTiers from "@/pages/membership-tiers";
import Transactions from "@/pages/transactions";
import Newsletter from "@/pages/newsletter";
import NewsletterCompose from "@/pages/newsletter-compose";
import NewsletterCampaigns from "@/pages/newsletter-campaigns";
import NotFound from "@/pages/not-found";

import { useAuth } from "./hooks/use-auth";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function ManagerRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role !== "manager") {
    return <Redirect to="/dashboard" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      
      <Route path="/dashboard">
        <Layout>
          <ProtectedRoute component={Dashboard} />
        </Layout>
      </Route>
      
      <Route path="/members">
        <Layout>
          <ProtectedRoute component={Members} />
        </Layout>
      </Route>
      
      <Route path="/members/new">
        <Layout>
          <ProtectedRoute component={NewMember} />
        </Layout>
      </Route>
      
      <Route path="/members/:id">
        {(params) => (
          <Layout>
            <ProtectedRoute component={MemberDetail} id={params.id} />
          </Layout>
        )}
      </Route>
      
      <Route path="/membership-tiers">
        <Layout>
          <ProtectedRoute component={MembershipTiers} />
        </Layout>
      </Route>
      
      <Route path="/transactions">
        <Layout>
          <ProtectedRoute component={Transactions} />
        </Layout>
      </Route>
      
      <Route path="/newsletter">
        <Layout>
          <ProtectedRoute component={Newsletter} />
        </Layout>
      </Route>
      
      <Route path="/newsletter/compose">
        <Layout>
          <ProtectedRoute component={NewsletterCompose} />
        </Layout>
      </Route>
      
      <Route path="/newsletter/compose/:id">
        {(params) => (
          <Layout>
            <ProtectedRoute component={NewsletterCompose} id={params.id} />
          </Layout>
        )}
      </Route>
      
      <Route path="/newsletter/campaigns">
        <Layout>
          <ProtectedRoute component={NewsletterCampaigns} />
        </Layout>
      </Route>
      
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
