import { Component, ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}
interface State {
  error: Error | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[QueryErrorBoundary]", error);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-6">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <div>
              <h2 className="text-lg font-semibold">Algo deu errado ao carregar</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Não conseguimos buscar os dados desta tela. Tente novamente em instantes.
              </p>
            </div>
            <Button onClick={this.reset} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function QueryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => <ErrorBoundaryInner onReset={reset}>{children}</ErrorBoundaryInner>}
    </QueryErrorResetBoundary>
  );
}

export default QueryErrorBoundary;
