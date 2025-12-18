declare module "swagger-ui-react" {
  import { Component } from "react";
  
  export interface SwaggerUIProps {
    url?: string;
    spec?: any;
    onComplete?: (system: any) => void;
    requestInterceptor?: (request: any) => any;
    responseInterceptor?: (response: any) => any;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    filter?: boolean | string;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    tryItOutEnabled?: boolean;
    requestSnippetsEnabled?: boolean;
    requestSnippets?: {
      generators?: any;
      defaultExpanded?: boolean;
      languages?: string[];
    };
    deepLinking?: boolean;
    showMutatedRequest?: boolean;
    supportedSubmitMethods?: string[];
    validatorUrl?: string | null;
    withCredentials?: boolean;
    presets?: any[];
    plugins?: any[];
    layout?: string;
    [key: string]: any;
  }
  
  export default class SwaggerUI extends Component<SwaggerUIProps> {}
}

declare module "swagger-ui-react/swagger-ui.css" {
  const content: string;
  export default content;
}

