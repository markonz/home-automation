 
export function formatDataAge (updateTimestamp) {
  const now = new Date();
  let dataAge = now - updateTimestamp;
  let format = "";

  let minutes = Math.floor(dataAge / (1000 * 60));
  let hours = Math.floor(minutes / 60);

  minutes -= (hours*60);

  if(hours > 17) {
    format = hours + ' h';
  } else if(hours > 0) {
    format = hours + ' h ' + minutes + ' min';
  }  else {
    format = minutes + ' min';
  }

  return(format);
}
