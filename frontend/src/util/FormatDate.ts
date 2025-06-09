const formatDate = (date: string | null): string =>
  date && date.match(/\d{4}-\d{2}-\d{2}/)
    ? `${date.split("-")[1]}/${date.split("-")[2]}/${date.split("-")[0]}`
    : "Invalid date";

export default formatDate;
