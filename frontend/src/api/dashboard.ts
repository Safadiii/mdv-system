import api from "./client";

import type {
  DashboardResponse
} from "../types/dashboard";


export async function getDashboard():
  Promise<DashboardResponse> {

  const response =
    await api.get<DashboardResponse>(
      "/dashboard/"
    );

  return response.data;
}

export async function exportDatabase() {

  const response = await api.get(
    "/dashboard/export",
    {
      responseType: "blob"
    }
  );


  const blob = new Blob(
    [response.data],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  );


  const url =
    window.URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;


  const disposition =
    response.headers[
      "content-disposition"
    ];


  let filename =
    "Inventory_Backup.xlsx";


  if (disposition) {

    const match =
      disposition.match(
        /filename="?([^"]+)"?/
      );


    if (match?.[1]) {
      filename = match[1];
    }

  }


  link.setAttribute(
    "download",
    filename
  );


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  window.URL.revokeObjectURL(
    url
  );
}