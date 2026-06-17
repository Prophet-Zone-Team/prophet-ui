declare module "tp-js-sdk" {
  const tp: {
    getCurrentWallet: () => Promise<{
      result: boolean;
      data?: {
        blockchain?: string;
        address?: string;
      };
    }>;
    getWallet: (params: {
      walletTypes: string[];
      switch: boolean;
    }) => Promise<{ result: boolean }>;
  };

  export default tp;
}
