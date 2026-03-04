import { Component, ReactNode, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);

    // DOM manipulation errors from browser extensions (translators etc.)
    if (
      error.message.includes("insertBefore") ||
      error.message.includes("removeChild") ||
      error.message.includes("appendChild") ||
      error.message.includes("Failed to execute")
    ) {
      window.location.reload();
      return;
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-6xl mb-2">😕</div>
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Ops! Algo deu errado</h2>
            <p className="text-muted-foreground text-sm">
              Não se preocupe, isso pode acontecer. Clique no botão abaixo para tentar novamente.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              >
                Recarregar Página
              </Button>
              <p className="text-sm text-muted-foreground">
                💡 Dica: Se usar tradutor automático, desative-o e tente novamente.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
