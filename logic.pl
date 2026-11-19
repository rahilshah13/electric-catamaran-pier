:- table state_cost/3.
edge(manufacturing, mount_blocks_to_bed, 1, 0.05).
edge(manufacturing, execute_roughing_path, 25, 0.08).
edge(manufacturing, execute_finishing_path, 5, 0.05).
edge(assembly, mount_blocks_to_bed, 1, 0.03).
edge(assembly, execute_roughing_path, 25, 0.06).
edge(assembly, execute_finishing_path, 5, 0.03).
edge(assembly, perform_laser_tracking, 10, 0.02).
edge(assembly, apply_priming_coat1, 15, 0.02).
edge(assembly, apply_priming_coat2, 20, 0.01).
edge(assembly, apply_final_polish, 30, 0.01).
edge(testing, apply_priming_coat1, 15, 0.01).
edge(testing, apply_priming_coat2, 20, 0.01).
edge(testing, perform_laser_tracking, 10, 0.01).
edge(testing, measure_dimensions, 25, 0.05).
edge(testing, apply_final_polish, 30, 0.05).
edge(testing, apply_water_resistance_test, 45, 0.05).
edge(testing, conduct_hydrodynamic_profiling, 60, 0.05).
edge(testing, perform_final_quality_inspection, 75, 0.05).

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
    AccLoss =< MaxLoss.
valid_dp_path(Curr, End, AccPath, Path, AccLoss, TotalLoss, MaxLoss) :-
    edge(Curr, Next, _, Loss),
    \+ member(Next, AccPath),
    NewLoss is AccLoss + Loss,
    NewLoss =< MaxLoss,
    valid_dp_path(Next, End, [Next|AccPath], Path, NewLoss, TotalLoss, MaxLoss).
