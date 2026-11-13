import { useEffect, useState } from "react";
import api from "../utils/api";
import SectionBlock from "./SectionBlock";

/* All visible sections designed in the admin panel, in the order set there. */
export default function HomeSections() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get("/sections").then((r) => setRows(r.data.sections || [])).catch(() => setRows([]));
  }, []);
  return <>{rows.map((s) => <SectionBlock key={s._id} section={s} />)}</>;
}
