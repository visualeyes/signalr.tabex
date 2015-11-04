
export default {
  maximizeInvokeResponse(minHubResponse) {
    return {
      state: minHubResponse.S,
      result: minHubResponse.R,
      progress: minHubResponse.P ? {
        id: minHubResponse.P.I,
        data: minHubResponse.P.D,
      } : null,
      id: minHubResponse.I,
      isHubException: minHubResponse.H,
      error: minHubResponse.E,
      stackTrace: minHubResponse.T,
      errorData: minHubResponse.D,
    };
  },

  maximizeEvtMessage(minData) {
    return {
      hub: minData.H,
      method: minData.M,
      args: minData.A,
      state: minData.S,
    };
  },
};
