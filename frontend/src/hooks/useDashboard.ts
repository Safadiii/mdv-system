import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  getDashboard
} from "../api/dashboard";

import type {
  DashboardResponse
} from "../types/dashboard";


export function useDashboard() {

  const [
    data,
    setData
  ] = useState<
    DashboardResponse | null
  >(null);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState<
    string | null
  >(null);


  const fetchDashboard =
    useCallback(async () => {

      try {

        setLoading(true);

        setError(null);


        const response =
          await getDashboard();


        setData(response);


      } catch (err) {

        console.error(err);

        setError(
          "Failed to load dashboard"
        );


      } finally {

        setLoading(false);

      }

    }, []);


  useEffect(() => {

    fetchDashboard();

  }, [fetchDashboard]);


  return {

    data,

    loading,

    error,

    refresh:
      fetchDashboard
  };
}