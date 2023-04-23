

export interface Log {
  _id?: string;
  req: RequestLogM;
  res: ResponseLogM | null;
  proxyInfo: ProxyInfoM;
}

export interface ProxyInfoM {
  proxyToUrl: string | null;
  isProxy: boolean;
}

export interface RequestLogM {
  body: any;
  rawBody: string;
  requestDate: Date;
  method: string;
  path: string;
  headers: {
    [key: string]: string | undefined | null;
  };
}

type ResponseLogM = {
  headers: {
    [key: string]: string | undefined | null;
  };
  body: any;
  rawBody: string | null;
  status: number;
  statusMessage: string;
  duration: number;
  responseDate: Date;
};
