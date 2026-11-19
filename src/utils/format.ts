import { default as dayjs } from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export const formatDate = (date: number) =>
  dayjs(date).locale("es").format("D [de] MMMM [de] YYYY h:mm A");
