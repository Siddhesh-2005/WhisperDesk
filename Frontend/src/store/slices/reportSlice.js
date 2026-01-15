import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportService from '../../services/report.service';

const initialState = {
  reports: [],
  pagination: null,
  targetReports: [],
  targetSummary: null,
  userReports: [],
  userPagination: null,
  stats: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

export const createReport = createAsyncThunk('reports/createReport', async (payload, thunkAPI) => {
  try {
    const res = await reportService.createReport(payload);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to create report';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getAllReports = createAsyncThunk('reports/getAllReports', async (params, thunkAPI) => {
  try {
    const res = await reportService.getAllReports(params);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch reports';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getTargetReports = createAsyncThunk('reports/getTargetReports', async (payload, thunkAPI) => {
  try {
    const res = await reportService.getTargetReports(payload);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch target reports';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getUserReports = createAsyncThunk('reports/getUserReports', async (params, thunkAPI) => {
  try {
    const res = await reportService.getUserReports(params);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch user reports';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const resolveReport = createAsyncThunk('reports/resolveReport', async ({ reportId, resolved }, thunkAPI) => {
  try {
    const res = await reportService.resolveReport(reportId, resolved);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to resolve report';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const deleteReport = createAsyncThunk('reports/deleteReport', async (reportId, thunkAPI) => {
  try {
    await reportService.deleteReport(reportId);
    return { reportId };
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to delete report';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getReportStats = createAsyncThunk('reports/getReportStats', async (_, thunkAPI) => {
  try {
    const res = await reportService.getReportStats();
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch report stats';
    return thunkAPI.rejectWithValue(msg);
  }
});

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReport.pending, (state) => { state.isLoading = true; })
      .addCase(createReport.fulfilled, (state, action) => {
        state.isLoading = false; state.isSuccess = true;
        state.reports = [action.payload, ...state.reports];
      })
      .addCase(createReport.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })

      .addCase(getAllReports.pending, (state) => { state.isLoading = true; })
      .addCase(getAllReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload.reports || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(getAllReports.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })

      .addCase(getTargetReports.pending, (state) => { state.isLoading = true; })
      .addCase(getTargetReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.targetReports = action.payload.reports || [];
        state.targetSummary = action.payload.summary || null;
      })
      .addCase(getTargetReports.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })

      .addCase(getUserReports.pending, (state) => { state.isLoading = true; })
      .addCase(getUserReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userReports = action.payload.reports || [];
        state.userPagination = action.payload.pagination || null;
      })
      .addCase(getUserReports.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })

      .addCase(resolveReport.pending, (state) => { state.isLoading = true; })
      .addCase(resolveReport.fulfilled, (state, action) => {
        state.isLoading = false; state.isSuccess = true;
        const updated = action.payload;
        const idx = state.reports.findIndex((r) => r._id === updated._id);
        if (idx !== -1) state.reports[idx] = updated;
        const idx2 = state.targetReports.findIndex((r) => r._id === updated._id);
        if (idx2 !== -1) state.targetReports[idx2] = updated;
        const idx3 = state.userReports.findIndex((r) => r._id === updated._id);
        if (idx3 !== -1) state.userReports[idx3] = updated;
      })
      .addCase(resolveReport.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })

      .addCase(deleteReport.pending, (state) => { state.isLoading = true; })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.isLoading = false; state.isSuccess = true;
        const id = action.payload.reportId;
        state.reports = state.reports.filter((r) => r._id !== id);
        state.targetReports = state.targetReports.filter((r) => r._id !== id);
        state.userReports = state.userReports.filter((r) => r._id !== id);
      })
      .addCase(deleteReport.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; })

      .addCase(getReportStats.pending, (state) => { state.isLoading = true; })
      .addCase(getReportStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload || null;
      })
      .addCase(getReportStats.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});

export const { reset } = reportSlice.actions;
export default reportSlice.reducer;
