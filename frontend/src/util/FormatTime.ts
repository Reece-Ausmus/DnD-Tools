const formatTime = (time: string | null): string =>
  time && time.match(/\d{2}:\d{2}/)
    ? `${((hour) => (hour === 0 ? 12 : hour > 12 ? hour - 12 : hour))(
        parseInt(time.split(":")[0], 10)
      )}:${time.split(":")[1]} ${
        parseInt(time.split(":")[0], 10) >= 12 ? "PM" : "AM"
      }`
    : "Invalid time";

export default formatTime;
