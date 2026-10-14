:- table state_cost/3.
edge(cad_tooling, 1, 10, 1).
edge(composite_layup, 1, 20, 1).
edge(composite_layup, 2, 25, 1).
edge(composite_layup, 3, 30, 1).
edge(resin_infusion, 4, 35, 1).
edge(resin_infusion, 5, 40, 1).
edge(hull_curing, 6, 55, 1).
edge(hull_curing, 7, 60, 1).
edge(skeletal_framing, 8, 75, 1).
edge(skeletal_framing, 9, 80, 1).
edge(battery_pack_assembly, 10, 90, 1).
edge(battery_pack_assembly, 11, 95, 1).
edge(solar_canopy_integration, 12, 110, 1).
edge(solar_canopy_integration, 13, 115, 1).
edge(dual_motor_wiring, 14, 125, 1).
edge(dual_motor_wiring, 15, 130, 1).
edge(telemetry_harness, 16, 140, 1).
edge(telemetry_harness, 17, 145, 1).
edge(ballast_testing, 18, 160, 1).
edge(ballast_testing, 19, 165, 1).
edge(hydrodynamic_profiling, 20, 180, 1).
edge(hydrodynamic_profiling, 21, 185, 1).
edge(final_qa, 22, 190, 1).
edge(final_qa, 23, 195, 1).

start_node(Node) :- edge(Node, _, _, _), \+ edge(_, Node, _, _).
end_node(Node) :- edge(_, Node, _, _), \+ edge(Node, _, _, _).

state_cost(Node, End, Cost) :- edge(Node, End, _, Cost).
state_cost(Node, End, TotalCost) :-
    edge(Node, Next, _, Cost),
    Node \= End,
    state_cost(Next, End, SubCost),
    TotalCost is Cost + SubCost.

paths_of_goodness(Paths) :-
    start_node(Start),
    end_node(End),
    findall(Path-Loss, valid_dp_path(Start, End, [Start], Path, 0, Loss, 0.95), Paths).

valid_dp_path(Node, Node, AccPath, AccPath, AccLoss, AccLoss, MaxLoss) :-
    AccLoss <= MaxLoss.
valid_dp_path(Curr, End, AccPath, Path, AccLoss, TotalLoss, MaxLoss) :-
    edge(Curr, Next, _, Loss),
    \+ member(Next, AccPath),
    NewLoss is AccLoss + Loss,
    NewLoss <= MaxLoss,
    valid_dp_path(Next, End, [Next|AccPath], Path, NewLoss, TotalLoss, MaxLoss).
