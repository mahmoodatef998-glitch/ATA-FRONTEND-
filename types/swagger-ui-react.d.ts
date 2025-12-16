/**
 * Type definitions for swagger-ui-react
 * Since @types/swagger-ui-react doesn't exist, we provide our own declarations
 */

declare module "swagger-ui-react" {
  import { Component } from "react";

  export interface SwaggerUIProps {
    spec?: any;
    url?: string;
    onComplete?: (system: any) => void;
    requestInterceptor?: (request: any) => any;
    responseInterceptor?: (response: any) => any;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    deepLinking?: boolean;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    filter?: boolean | string;
    tryItOutEnabled?: boolean;
    requestSnippetsEnabled?: boolean;
    requestSnippets?: {
      generators?: {
        [key: string]: {
          [key: string]: any;
        };
      };
      defaultExpanded?: boolean;
      languages?: string[];
    };
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    persistAuthorization?: boolean;
    [key: string]: any;
  }

  export default class SwaggerUI extends Component<SwaggerUIProps> {}
}

declare module "swagger-ui-react/swagger-ui.css" {
  const content: string;
  export default content;
}

