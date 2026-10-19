type RouteContext<T extends string> = {
  params: Promise<{
    id: string;
    [key: string]: string | string[] | undefined;
  }>;
};
