// Draft agenda: elapsed time, rather than an unconfirmed conference start time.
// Total: 3h30 teaching + 30-minute break. Edit titles and timings here.
export const schedule = [
  {
    time: "0:00–0:30",
    kind: "Talk",
    title: "MAPF foundations & lifelong planning",
    description:
      "Collision constraints, common objectives and the shift from fixed goals to a continuing stream of tasks.",
  },
  {
    time: "0:30–0:55",
    kind: "Guided lab",
    title: "Run your first scenario",
    image: "/images/event-covers/02-first-scenario-solids.webp",
    imageOffset: "85%",
    imageTint: "#a57faa",
    description:
      "Get the tools running, visualise a small example, and identify waiting, congestion and task progress.",
  },
  {
    time: "0:55–1:25",
    kind: "Talk",
    title: "From graph paths to robot motion",
    description:
      "Explore orientation, turn actions and motion feasibility, and how they change the meaning of a good path.",
  },
  {
    time: "1:25–1:55",
    kind: "Guided lab",
    title: "Compare motion models",
    image: "/images/event-covers/04-compare-stairs-stream-green-v1.webp",
    imageTint: "#7f9164",
    description:
      "Adjust motion-related settings and inspect their effect on paths, execution time and congestion.",
  },
  {
    time: "1:55–2:25",
    kind: "Break",
    title: "Take a break",
    description: "30 minutes away from the experiments.",
  },
  {
    time: "2:25–2:55",
    kind: "Talk",
    title: "Task scheduling & execution uncertainty",
    image: "/images/event-covers/06-scheduling-terraces.webp",
    imageTint: "#ba6878",
    description:
      "Connect assignment and pickup-and-delivery decisions to planning, then examine monitoring, delays and replanning.",
  },
  {
    time: "2:55–3:50",
    kind: "Guided lab",
    title: "Investigate scheduling and delays",
    description:
      "Compare scheduling choices and inspect execution traces when agents fall behind their nominal plans.",
  },
  {
    time: "3:50–4:00",
    kind: "Discussion",
    title: "What did the experiments reveal?",
    image: "/images/event-covers/08-findings-circular-pool.webp",
    imageTint: "#c1879f",
    description:
      "Bring the observations together, discuss emerging research directions, and share questions.",
  },
];
