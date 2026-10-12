import { render } from 'solid-js/web';
import { createSignal, For } from 'solid-js';
import JSZip from 'jszip';

const INITIAL_CATAMARAN_BRANCHES = [
  { 
    id: 'cat-01', 
    branch: 'Site Tooling & Master Plug CNC', 
    category: 'Tooling', 
    type: 'STEP', 
    name: '01_Site_Tooling_And_Master_Plug_CNC.step', 
    content: 'ISO 10303-21 - 5-Axis CNC Machining protocol for 14.5m Port/Starboard Hull Master Plugs. Spindle speed: 18,000 RPM, feed rate: 12,000 mm/min using polyurethane tooling board (density 0.65 g/cm3). Surface finish target: Ra 0.8 um with multi-stage hand sanding and tool-grade epoxy primer application.', 
    status: 'Pending', 
    parameters: {
      spindleSpeed: '18000',
      feedRate: '12000',
      toolingBoardDensity: '0.65',
      surfaceFinishTarget: 'Ra 0.8 um'
    },
    tasks: [
      'Mount high-density polyurethane blocks to precision steel master bed using vacuum chucks and mechanical anchor toggles.',
      'Execute roughing toolpath using 25mm ball-nose carbide cutter with 55% stepover and constant chip load calculation.',
      'Execute finishing 5-axis simultaneous toolpath with 2mm ball-nose cutter, ensuring zero chatter marks across complex tumblehome curvatures.',
      'Perform dimensional laser tracker verification against CAD datum lines, confirming tolerances within +/- 0.15 mm.',
      'Apply three coats of high-build vinyl ester tooling primer, intermediate wet-sanding with 400-grit abrasive, and final polish to mirror gloss.'
    ] 
  },
  { 
    id: 'cat-02', 
    branch: 'Raw Materials & Sourcing', 
    category: 'Materials', 
    type: 'JSON', 
    name: '02_Resin_And_Core_Material_Manifest.json', 
    content: JSON.stringify({ 
      resin: 'Bio-Epoxy SR GreenPoxy 56 (56% plant-origin carbon content)', 
      hardener: 'SD Surf slow curing amine hardener (gel time: 420 minutes at 22C)', 
      core: 'PET Foam HT70 25mm rigid structural foam sheets (density 70 kg/m3)', 
      reinforcement: 'Multiaxial Carbon Fiber Fabric 600g/m2 [0/+45/-45/90]' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      resinType: 'Bio-Epoxy SR GreenPoxy 56',
      coreDensity: '70 kg/m3',
      reinforcementWeight: '600g/m2'
    },
    tasks: [
      'Inspect bio-epoxy resin drums upon delivery; record batch numbers, specific gravity, and viscosity curves in ERP ledger.',
      'Execute Fourier-transform infrared spectroscopy (FTIR) random sample checks on multiaxial carbon fabric to verify sizing compatibility.',
      'Store closed-cell PET foam panels in climate-controlled staging bay at 20C and <50% relative humidity to prevent moisture absorption.',
      'Weigh out precise resin-to-hardener ratios using calibrated digital load cells with an accuracy tolerance of +/- 2 grams.',
      'Stage vacuum bagging consumables including high-temp sealant tape, peel ply, micro-perforated release film, and breathable fleece.'
    ] 
  },
  { 
    id: 'cat-03', 
    branch: 'Infusion & Lamination', 
    category: 'Fabrication', 
    type: 'CSV', 
    name: '03_Vacuum_Assisted_Infusion_Telemetry.csv', 
    content: 'timestamp,vacuum_mbar,temp_c,resin_flow_rate_lpm\n2026-10-11T08:00:00Z,2.2,24.1,1.2\n2026-10-11T08:30:00Z,2.1,24.3,1.5\n2026-10-11T09:00:00Z,1.9,24.8,1.8\n2026-10-11T10:15:00Z,1.8,25.2,0.9', 
    status: 'Pending', 
    parameters: {
      targetVacuumMbar: '2.0',
      injectionTempC: '45',
      cureDurationHours: '12'
    },
    tasks: [
      'Lay up multiaxial carbon plies inside female mold cavity following stacking sequence diagrams and fiber orientation markers.',
      'Install spiral distribution channels, resin feed lines, and vacuum collection galleries with leak-tight sealant tape placement.',
      'Pull preliminary vacuum test across the sealed bag; enforce maximum allowable pressure drop of < 0.05 bar over a 30-minute hold test.',
      'Initiate VARTM resin injection at 45C controlled pot temperature, monitoring resin front progression across all structural ribs.',
      'Clamp feed lines immediately upon resin breakthrough into catch pots; maintain full vacuum throughout the 12-hour exothermic cure cycle.'
    ] 
  },
  { 
    id: 'cat-05', 
    branch: 'Structural Bulkheads', 
    category: 'Structural', 
    type: 'JSON', 
    name: '05_Transverse_Beam_And_Bulkhead_Bond.json', 
    content: JSON.stringify({ 
      adhesive: '3M DP490 Structural Toughened Epoxy Paste', 
      surface_prep: 'Mechanical grit-blasting and acetone solvent degreasing', 
      cure_cycle: 'Ramping to 60C for 8 hours via automated silicone heating blankets', 
      torque_spec: 'M12 titanium fasteners torqued to 35 Nm' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      adhesiveCompound: '3M DP490 Structural Toughened Epoxy',
      cureTempC: '60',
      fastenerTorqueNm: '35'
    },
    tasks: [
      'Trim infused composite bulkhead panels to exact hull interior template dimensions using diamond-coated abrasive cutting wheels.',
      'Abrade bonding flanges with 80-grit sanding discs to expose fresh carbon fibers, followed by medical-grade solvent wipe down.',
      'Apply structural epoxy paste adhesive evenly across joint flanges using pneumatic cartridge guns with static mixing nozzles.',
      'Position transverse bridge deck bulkheads into hull slots using overhead gantry crane; verify squareness and perpendicularity within 1.0mm.',
      'Attach flexible silicone heating blankets across all primary bond lines and ramp temperature to 60C for 8 hours to achieve full cross-linking.'
    ] 
  },
  { 
    id: 'cat-06', 
    branch: 'Interior Layout & Modules', 
    category: 'Interior', 
    type: 'GLTF', 
    name: '06_Interior_Cabin_Modular_Layout.gltf', 
    content: '{ "asset": { "version": "2.0" }, "generator": "Blender glTF exporter", "nodes": [{"name": "SaloonSofa_Module"}, {"name": "NavDesk_Ergonomics"}, {"name": "GalleyInductionCooktop"}] }', 
    status: 'Pending', 
    parameters: {
      moduleMaterial: 'Lightweight Honeycomb Composite',
      finishGrade: 'Matte Marine Clear Coat',
      fastenerType: 'Countersunk Titanium Inserts'
    },
    tasks: [
      'Import modular cabin sub-assemblies into positioning jig and verify clearance tolerances against interior hull liners.',
      'Secure lightweight composite floorboards using vibration-dampening elastomeric adhesive pads and threaded insert anchors.',
      'Mount saloon settee frames and ergonomic navigation station consoles, routing concealed wire harnesses through integrated conduits.',
      'Install marine-grade acrylic cabinetry doors equipped with positive-latching hardware designed to withstand offshore wave impacts.',
      'Perform final interior fit-out laser scan to confirm exact alignment of berth frames and overhead LED lighting pelmets.'
    ] 
  },
  { 
    id: 'cat-07', 
    branch: 'Lightweight Furniture', 
    category: 'Interior', 
    type: 'STEP', 
    name: '07_Nomex_Honeycomb_Furniture_Panels.step', 
    content: 'ISO 10303-21 - Lightweight Saloon Table and Berth Core Assembly. Nomex aramid paper honeycomb (cell size 3.2mm, density 48 kg/m3) laminated between 0.5mm high-pressure decorative laminate skins.', 
    status: 'Pending', 
    parameters: {
      honeycombCellSizeMm: '3.2',
      coreDensityKgM3: '48',
      skinThicknessMm: '0.5'
    },
    tasks: [
      'Machine Nomex aramid honeycomb blocks to net shape using high-speed CNC routers with down-cut spiral tooling.',
      'Infill edge-banding zones and fastener hardpoints with high-density microballoon epoxy potting compound.',
      'Vacuum-press decorative laminate skins to both honeycomb faces using structural polyurethane adhesive in heated flat-bed press.',
      'Edge-trim composite panels and seal exposed perimeters with matching ABS thermoplastic edging strip applied via hot-melt extrusion.',
      'Pre-drill mounting holes and install threaded brass furniture inserts using calibrated torque insertion drivers.'
    ] 
  },
  { 
    id: 'cat-08', 
    branch: 'Flame-Retardant Upholstery', 
    category: 'Interior', 
    type: 'JSON', 
    name: '08_IMO_Flame_Retardant_Upholstery_Cert.json', 
    content: JSON.stringify({ 
      fabric: '100% Recycled Ocean Wool (Weight: 520 g/m2)', 
      flammability_standard: 'IMO FTP Code Part 8 (Cigarette and Match Ignition Test Passed)', 
      foam_core: 'CMHR (Combustion Modified High Resilience) polyurethane foam core' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      fabricWeightGsm: '520',
      flammabilityCode: 'IMO FTP Code Part 8',
      foamType: 'CMHR High Resilience'
    },
    tasks: [
      'Cut recycled ocean wool upholstery fabrics using automated CNC fabric nesting cutters to minimize material wastage.',
      'Wrap CMHR polyurethane foam cushions with moisture-resistant breathable barrier membranes prior to final slipcover encasement.',
      'Stitch seams using high-tensile Kevlar thread with reinforced box-stitching on all stress-bearing cushion corners.',
      'Verify fire retardant certification tags are securely sewn into each cushion assembly in compliance with maritime safety codes.',
      'Fit completed cushions into saloon berths and modular lounging zones, ensuring snug friction fit against retaining battens.'
    ] 
  },
  { 
    id: 'cat-09', 
    branch: 'HVAC & ERV Ventilation', 
    category: 'Interior', 
    type: 'JSON', 
    name: '09_HVAC_And_Enthalpy_ERV_Spec.json', 
    content: JSON.stringify({ 
      unit: '12000 BTU Inverter Marine Heat Pump with Soft-Start', 
      ventilation: 'Dual-core Enthalpy Energy Recovery Ventilator (ERV)', 
      refrigerant: 'R-32 (Low GWP 675)', 
      airflow_cfm: 180 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      btuCapacity: '12000',
      refrigerantType: 'R-32',
      airflowCfm: '180'
    },
    tasks: [
      'Mount inverter compressor unit on vibration-isolating neoprene mounts within dedicated acoustic machinery enclosure.',
      'Route insulated marine ducting from ERV core to each cabin berth and saloon diffuser vent without sharp radius bends.',
      'Connect raw water cooling circuit through dedicated through-hull fitting, sea strainer, and bronze-body positive displacement pump.',
      'Wire digital thermostat controllers to central 24V DC domotics bus and calibrate temperature sensor feedback loops.',
      'Perform pressure test on refrigerant lines at 3.0 MPa using dry nitrogen and execute 45-minute deep vacuum purge before opening service valves.'
    ] 
  },
  { 
    id: 'cat-10', 
    branch: 'Domotics & Lighting Bus', 
    category: 'Interior', 
    type: 'STEP', 
    name: '10_24V_Domotics_And_Lighting_Bus.step', 
    content: 'ISO 10303-21 - Dimmable LED driver channels and OLED touch panel mounting enclosures. CANopen protocol architecture over twisted-pair shielded marine cable.', 
    status: 'Pending', 
    parameters: {
      busProtocol: 'CANopen over Shielded Twisted Pair',
      operatingVoltageV: '24V DC',
      dimmingFrequencyHz: '1000'
    },
    tasks: [
      'Run marine-grade tinned copper cabling (Conductor type Tinned Annealed Copper Class 5) through dedicated wire ways.',
      'Install 24V DC PWM dimmable LED light strips into aluminum extrusion channels with frosted diffusers along hull sheer lines.',
      'Mount 7-inch glass-front OLED touch control panels at main bulkhead entry points and master berth consoles.',
      'Configure CANopen node IDs for each lighting zone, climate actuator, and tank level sensor on the central backbone bus.',
      'Execute full system diagnostic sweep via terminal software to verify packet delivery ratios and zero bus error frames.'
    ] 
  },
  { 
    id: 'cat-11', 
    branch: 'HV Battery Pack Assembly', 
    category: 'Electrical', 
    type: 'JSON', 
    name: '11_800V_LiFePO4_Battery_Pack_BOM.json', 
    content: JSON.stringify({ 
      nominal_voltage_v: 800.0, 
      capacity_kwh: 160.0, 
      cell_chemistry: 'Prismatic 100Ah Lithium Iron Phosphate (LiFePO4)', 
      bms_topology: 'Master-Slave distributed architecture with optical isolation' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      packVoltageV: '800',
      energyKwh: '160',
      cellChemistry: 'Prismatic LiFePO4 100Ah'
    },
    tasks: [
      'Sort LiFePO4 prismatic cells by internal resistance and resting voltage within a 0.5mV delta before module grouping.',
      'Compress cell stacks inside structural aluminum enclosure plates using calibrated torque tie-rods and dielectric insulation pads.',
      'Install laser-welded busbars across cell terminals and mount slave Battery Management System (BMS) telemetry circuit boards.',
      'Integrate liquid-cooling aluminum cooling plates between cell rows; pressure test coolant manifold to 1.5 bar for 10 minutes.',
      'Perform initial pack charge-discharge balancing cycle while logging thermal imaging data to verify even heat dissipation.'
    ] 
  },
  { 
    id: 'cat-12', 
    branch: 'BMS Firmware Flashing', 
    category: 'Firmware', 
    type: 'BIN', 
    name: '12_BMS_Firmware_Cryptographic_Hash.bin', 
    content: 'SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nTarget MCU: STM32F469 High-Performance ARM Cortex-M4 with FPU', 
    status: 'Pending', 
    parameters: {
      targetMcu: 'STM32F469 ARM Cortex-M4',
      checksumAlgorithm: 'SHA-256',
      baudRate: '115200'
    },
    tasks: [
      'Connect isolated programming dongle to master BMS debug header and verify power rail stability at 3.3V DC.',
      'Erase target flash memory sectors and flash signed firmware binary using secure ST-LINK flashing utility.',
      'Verify cryptographic SHA-256 checksum against build manifest to ensure zero bit corruption during flashing process.',
      'Run automated hardware-in-the-loop (HIL) test script to simulate over-voltage, under-voltage, and thermal runaway fault triggers.',
      'Lock debugging read-out protection fuses and archive firmware version tag in vessel permanent quality log.'
    ] 
  },
  { 
    id: 'cat-13', 
    branch: 'Propulsion Pods', 
    category: 'Propulsion', 
    type: 'STL', 
    name: '13_Axial_Flux_Motor_Leg_Assembly.stl', 
    content: 'solid MotorPod\n facet normal 0 0 1\n  outer loop\n   vertex 0 0 0\n   vertex 1 0 0\n   vertex 1 1 0\n  endloop\n endfacet\nendsolid\nPower: Dual 125kW continuous outrunner axial-flux permanent magnet motors.', 
    status: 'Pending', 
    parameters: {
      motorPowerKw: '125',
      housingAlloy: 'Al-Mg-Sc Forged Billet',
      coolingFluid: 'Synthetic Dielectric Oil'
    },
    tasks: [
      'Machine dual outrunner axial-flux motor housings from forged Al-Mg-Sc (Aluminium-Magnesium-Scandium) alloy billets on 5-axis mill.',
      'Install stator windings, neodymium permanent magnet rotors, and dual mechanical shaft seals with ceramic face plates.',
      'Fill pod gear case and motor cavity with high-purity synthetic dielectric cooling oil to specified expansion level.',
      'Mount propulsion pods to transoms using vibration-isolated titanium swivel brackets and waterproof steering actuators.',
      'Perform dry spin test on motor test bench; measure stator resistance, back-EMF voltage symmetry, and bearing vibration spectrum.'
    ] 
  },
  { 
    id: 'cat-14', 
    branch: 'Hydrofoil Actuators', 
    category: 'Foils', 
    type: 'STEP', 
    name: '14_Retractable_T_Foil_Actuator.step', 
    content: 'ISO 10303-21 - Titanium Ti-6Al-4V Daggerboard Pivot and Hydraulic Ram Assembly. Working pressure: 210 bar max operating load.', 
    status: 'Pending', 
    parameters: {
      maxPressureBar: '210',
      actuatorAlloy: 'Titanium Ti-6Al-4V',
      strokeSpeedSec: '1.2'
    },
    tasks: [
      'Inspect forged Titanium Ti-6Al-4V daggerboard struts for surface micro-cracks using fluorescent penetrant inspection (FPI).',
      'Assemble hydraulic pivot rams, proportional control valves, and linear position feedback sensors into stainless steel manifold block.',
      'Flush hydraulic circuit with ISO VG 46 mineral oil until particle count meets NAS 1638 Class 6 cleanliness standard.',
      'Mount retractable T-foil daggerboard assembly into hull trunk case, sealing trunk with dual-lip inflatable wiper gaskets.',
      'Execute full stroke actuation cycle test under simulated hydrodynamic load; verify response time < 1.2 seconds from full extension to retraction.'
    ] 
  },
  { 
    id: 'cat-15', 
    branch: 'Certification & HIN', 
    category: 'Regulatory', 
    type: 'JSON', 
    name: '15_ISO_12215_And_CE_Category_A_Registry.json', 
    content: JSON.stringify({ 
      standards_applied: ['ISO 12215-5 (Scantlings)', 'ISO 13297 (Small Craft Electrical Systems)', 'CE Category A (Ocean)'], 
      hin: 'US-ABC-99999-B626', 
      max_persons: 12 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      ceDesignCategory: 'Category A (Ocean)',
      maxPersons: '12',
      scantlingStandard: 'ISO 12215-5'
    },
    tasks: [
      'Compile structural engineering calculations, laminate test coupons, and hydrostatic test logs into technical construction file.',
      'Engage notified body surveyor to conduct physical scantling inspection and stability test compliance review under CE Category A rules.',
      'Stamp Hull Identification Number (HIN) permanently into transom structural bulkhead using deep-impression metal die punch.',
      'Issue Builder Certificate, Declaration of Conformity (DoC), and official Craft Identification Manual for vessel registry.',
      'Affix builder plate and maximum capacity plates adjacent to main steering helm station.'
    ] 
  },
  { 
    id: 'cat-16', 
    branch: 'Dockside Commissioning', 
    category: 'QA', 
    type: 'JSON', 
    name: '16_Dockside_Commissioning_Checklist.json', 
    content: JSON.stringify({ 
      hi_pot_test_v: 2500, 
      static_stability_angle_deg: 72.5, 
      sea_trial_max_speed_knots: 28.5, 
      nav_electronics: 'Simrad NSS evo3s integrated navigation suite' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      hiPotVoltageV: '2500',
      maxSpeedKnots: '28.5',
      stabilityAngleDeg: '72.5'
    },
    tasks: [
      'Perform 2500V AC dielectric withstand (Hi-Pot) test on 800V DC propulsion and charging circuits for 60 seconds without leakage.',
      'Calibrate inertial navigation system, GPS compass, multi-beam sonar transducer, and autopilot heading sensors.',
      'Execute dockside wet test of bilge pumps, fire suppression systems, emergency steering backups, and navigation light arrays.',
      'Launch vessel into test basin; conduct static heel stability test and verify freeboard marks against design waterline specs.',
      'Proceed to open water sea trial; record propulsion efficiency, turning radius, foil lift transition speed, and maximum sprint velocity.'
    ] 
  }
];

const INITIAL_PIER_BRANCHES = [
  { 
    id: 'pier-01', 
    branch: 'County Zoning & Lease Law', 
    category: 'County Law', 
    type: 'JSON', 
    name: '01_County_Submerged_Land_Lease_Zoning.json', 
    content: JSON.stringify({ 
      zoning_designation: 'Waterfront Mixed Use (WMU)', 
      lease_id: 'SLL-2026-8812', 
      setback_compliance: 'Verified 25ft buffer from adjacent riparian property lines' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      zoningCode: 'Waterfront Mixed Use (WMU)',
      setbackBufferFt: '25',
      leaseDurationYears: '30'
    },
    tasks: [
      'Submit formal submerged land lease application package to county zoning board along with riparian property deed surveys.',
      'Verify compliance with municipal waterfront setback requirements, riparian rights boundaries, and maximum pier length limitations.',
      'Publish public notice in local legal gazette regarding proposed fixed pier and boathouse construction project.',
      'Attend county commissioners public hearing to address environmental impact queries and secure unanimous zoning variance approval.',
      'Execute formal lease agreement contract and settle annual submerged land lease fee schedule with county comptroller.'
    ] 
  },
  { 
    id: 'pier-02', 
    branch: 'State Coastal Management Law', 
    category: 'State Law', 
    type: 'JSON', 
    name: '02_State_DEP_Coastal_Resource_Permit.json', 
    content: JSON.stringify({ 
      state_agency: 'Department of Environmental Protection (DEP)', 
      environmental_rule: 'Ch. 62-330 F.A.C. Environmental Resource Permitting', 
      mangrove_impact: 'Zero Impact - Hand-augered piling placement avoiding root zones' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      stateAgency: 'Department of Environmental Protection',
      ruleReference: 'Ch. 62-330 F.A.C.',
      turbidityCurtainRequired: 'Yes'
    },
    tasks: [
      'Conduct biological benthic survey to map seagrass beds, coral outcrops, and protected marine habitat boundaries.',
      'File Environmental Resource Permit (ERP) application with State Department of Environmental Protection.',
      'Implement turbidity curtain deployment plan around construction perimeter to contain suspended silt during pile driving.',
      'Perform pre-construction and post-construction manatee observation monitoring protocols during all in-water work windows.',
      'Receive formal DEP stamp of consistency with Florida Coastal Management Program guidelines.'
    ] 
  },
  { 
    id: 'pier-03', 
    branch: 'Federal USACE Permit Law', 
    category: 'Federal Law', 
    type: 'JSON', 
    name: '03_Federal_USACE_Nationwide_Permit_3.json', 
    content: JSON.stringify({ 
      federal_agency: 'U.S. Army Corps of Engineers (USACE)', 
      statute: 'Section 10 of Rivers and Harbors Act & Section 404 of Clean Water Act', 
      permit_type: 'Nationwide Permit (NWP) 3 - Maintenance & Structure Placement' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      permitType: 'Nationwide Permit (NWP) 3',
      statutes: 'Section 10 & Section 404',
      shpoConsultation: 'Required'
    },
    tasks: [
      'Prepare joint application form ENG 4345 for USACE district engineer review including engineering drawings and wetland maps.',
      'Coordinate cultural resource screening with State Historic Preservation Officer (SHPO) to ensure zero archaeological disturbance.',
      'Submit Endangered Species Act (ESA) Section 7 consultation package addressing smalltooth sawfish and marine turtle protection.',
      'Secure formal verification letter granting authorization under USACE Nationwide Permit 3 guidelines.',
      'Post mandatory federal permit notification placard at construction site entrance prior to mobilization.'
    ] 
  },
  { 
    id: 'pier-04', 
    branch: 'Bathymetric Sonar Survey', 
    category: 'Survey', 
    type: 'JSON', 
    name: '04_Bathymetric_Sonar_Survey.json', 
    content: JSON.stringify({ 
      depth_range_mlw_ft: '4.5 to 8.2 feet at Mean Low Water', 
      substrate_type: 'Silty-sand overlaying hard limestone bedrock shelf', 
      eelgrass_buffer_ft: 15.0 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      surveyGridIntervalM: '5.0',
      minLowWaterDepthFt: '4.5',
      sonarFrequencyKhz: '200'
    },
    tasks: [
      'Mobilize RTK-GPS equipped hydrographic survey vessel running multi-beam echosounder and side-scan sonar arrays.',
      'Grid survey area across proposed pier footprint at 5-meter line intervals to establish bottom contour elevation profiles.',
      'Identify bedrock refusal strata depth and sediment thickness across all proposed piling locations.',
      'Generate georeferenced bathymetric contour map and sub-bottom profile data sheets for structural engineering review.',
      'Establish permanent benchmark monuments onshore for elevation and horizontal positioning control during construction.'
    ] 
  },
  { 
    id: 'pier-05', 
    branch: 'Geotechnical Boring', 
    category: 'Engineering', 
    type: 'JSON', 
    name: '05_Geotechnical_Refusal_Boring_Log.json', 
    content: JSON.stringify({ 
      refusal_depth_ft: 18.5, 
      ultimate_pile_capacity_tons: 25.0, 
      strata_summary: '0-6ft soft silt, 6-18.5ft dense sand/shell, refusal on Miami Limestone' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      refusalDepthFt: '18.5',
      pileCapacityTons: '25.0',
      bearingStratum: 'Miami Limestone'
    },
    tasks: [
      'Deploy barge-mounted drill rig to extract continuous standard penetration test (SPT) soil samples at pier corners.',
      'Record N-values and soil shear strength parameters across overburden layers down to limestone bedrock refusal.',
      'Perform laboratory unconfined compressive strength tests on rock core samples retrieved from refusal depth.',
      'Calculate skin friction and end-bearing load capacities for timber and concrete piling sizing.',
      'Publish certified geotechnical report stamped by professional engineer registered in structural/geotechnical disciplines.'
    ] 
  },
  { 
    id: 'pier-06', 
    branch: 'Timber Piling Installation', 
    category: '3D Print', 
    type: 'STL', 
    name: '06_CCA_Timber_Piling_Detail.stl', 
    content: 'solid Piling\n facet normal 0 0 1\n  outer loop\n   vertex 0 0 0\n   vertex 1 0 0\n   vertex 1 1 0\n  endloop\n endfacet\nendsolid\nMaterial: Class A Southern Yellow Pine treated with Chromated Copper Arsenate (CCA) to 2.5 lbs/cu.ft retention.', 
    status: 'Pending', 
    parameters: {
      treatmentRetentionLbsCuFt: '2.5',
      buttDiameterInches: '12',
      timberSpecies: 'Southern Yellow Pine Class A'
    },
    tasks: [
      'Stage CCA-treated Southern Yellow Pine pilings (minimum 12-inch butt diameter) alongside marine pile driving barge.',
      'Position vibratory pile hammer and crane lead to drive pilings vertically to calculated tip elevation and limestone refusal.',
      'Monitor driving resistance and blow counts to verify minimum load-bearing capacity exceeds 25 tons per pile.',
      'Cut piling tops to precise datum grade elevation using chainsaw guide frames and attach galvanized steel pile caps.',
      'Install heavy-duty bolted marine fender blocks and rubbing strips along outer piling bents.'
    ] 
  },
  { 
    id: 'pier-07', 
    branch: 'Concrete Pile Caps', 
    category: 'Structural', 
    type: 'STEP', 
    name: '07_Concrete_Cap_Rebar_Cage.step', 
    content: 'ISO 10303-21 - Pile cap reinforcing steel assembly. Concrete strength: 5,000 PSI marine-grade mix with silica fume additive.', 
    status: 'Pending', 
    parameters: {
      concretePsi: '5000',
      additive: 'Silica Fume',
      rebarCoverInches: '3.0'
    },
    tasks: [
      'Fabricate custom epoxy-coated reinforcing steel (rebar) cages in yard jigs per structural engineering detail drawings.',
      'Lower rebar cages over piling heads, ensuring minimum 3-inch concrete cover on all exterior faces for corrosion protection.',
      'Construct leak-proof timber and steel formwork boxes around pile head connections and brace securely against wave action.',
      'Pour 5,000 PSI marine-grade concrete mix using concrete pump truck; vibrate thoroughly to eliminate honeycombing around rebar.',
      'Cure concrete under wet burlap blankets for 7 days before stripping formwork and applying penetrative silane sealer.'
    ] 
  },
  { 
    id: 'pier-08', 
    branch: 'Boathouse Superstructure', 
    category: '3D Scene', 
    type: 'GLTF', 
    name: '08_Boathouse_Truss_And_Canopy.gltf', 
    content: '{ "asset": { "version": "2.0" }, "scenes": [{ "nodes": [1, 2, 3] }], "description": "Marine-grade 6061-T6 structural aluminum truss frame with standing-seam galvalume roof canopy." }', 
    status: 'Pending', 
    parameters: {
      trussAlloy: '6061-T6 Structural Aluminum',
      windRatingMph: '160',
      roofMaterial: 'Standing-Seam Galvalume'
    },
    tasks: [
      'Erect pre-fabricated 6061-T6 structural aluminum roof trusses onto concrete pile caps using floating crane barge.',
      'Secure truss connections with 316 stainless steel structural bolts, lock washers, and anti-seize thread compound.',
      'Install standing-seam galvalume roof panels with wind-uplift clips designed to withstand 160 mph hurricane sustained winds.',
      'Mount rainwater gutter systems, downspouts, and first-flush stormwater filtration boxes along eaves.',
      'Install perimeter safety handrails, mooring cleats, and boarding ladders in accordance with OSHA and local safety codes.'
    ] 
  },
  { 
    id: 'pier-09', 
    branch: 'Bifacial Solar Array', 
    category: 'Utilities', 
    type: 'JSON', 
    name: '09_Solar_Bifacial_Array_Spec.json', 
    content: JSON.stringify({ 
      capacity_kw: 6.0, 
      panel_type: 'Monocrystalline Bifacial PERC (400W each x 15 panels)', 
      inverter: 'Grid-tied Hybrid Inverter with 20kWh LiFePO4 energy storage buffer' 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      arrayCapacityKw: '6.0',
      panelType: 'Monocrystalline Bifacial PERC 400W',
      tiltAngleDeg: '18'
    },
    tasks: [
      'Mount anodized aluminum solar racking rails to boathouse standing-seam roof at optimized 18-degree south-facing tilt angle.',
      'Secure 400W monocrystalline bifacial solar panels using mid-clamps and end-clamps with grounding lug attachments.',
      'Route UV-rated solar DC home-run cables through conduit trays down to weather-resistant electrical utility enclosure.',
      'Install hybrid grid-tied inverter, DC disconnect breakers, and 20kWh backup LiFePO4 battery energy storage bank.',
      'Commission inverter system, verify MPPT tracking efficiency, and test automatic grid-island transfer switch functionality.'
    ] 
  },
  { 
    id: 'pier-10', 
    branch: 'Marine Subpanel & ELCI', 
    category: 'Utilities', 
    type: 'JSON', 
    name: '10_Marine_Subpanel_ELCI_Protection.json', 
    content: JSON.stringify({ 
      service: '100A 240V Single Phase Feed from Shore Power Transformer', 
      nec_compliance: 'NEC Article 555 Marinas and Boatyards Compliant', 
      elci_trip_current_ma: 30 
    }, null, 2), 
    status: 'Pending', 
    parameters: {
      serviceAmperage: '100A 240V Single Phase',
      elciTripMa: '30',
      enclosureRating: 'NEMA 4X Stainless Steel'
    },
    tasks: [
      'Mount NEMA 4X stainless steel electrical distribution subpanel inside weather-sealed boathouse equipment locker.',
      'Install main 100A breaker and branch circuit breakers equipped with 30mA Equipment Leakage Circuit Interrupter (ELCI) modules.',
      'Run marine armored cable (Tinned copper conductors with PVC jacket and bronze braid armor) from shore service pedestal.',
      'Install dedicated green wire shore ground bonding bus connected to underwater copper ground plate to prevent stray current corrosion.',
      'Perform rigorous insulation resistance (Megger) testing on all branch circuits at 500V DC before energizing system.'
    ] 
  },
  { 
    id: 'pier-11', 
    branch: 'DC Fast Charger Commissioning', 
    category: 'Equipment', 
    type: 'GLB', 
    name: '11_IP67_DC_Fast_Charger_Pedestal.glb', 
    content: '[BINARY GLTF - 50kW DC Fast Charger Dock Pedestal with CCS1 and Type 2 marine charging cables]', 
    status: 'Pending', 
    parameters: {
      chargerPowerKw: '50',
      connectorStandard: 'CCS1 & Type 2 Marine',
      waterproofRating: 'IP67'
    },
    tasks: [
      'Anchor IP67 waterproof 50kW DC fast charger pedestal to reinforced concrete pier deck using marine-grade stainless steel studs.',
      'Connect high-voltage DC power cables and Ethernet communications link from boathouse inverter and server room.',
      'Perform electrical phase rotation check, ground continuity verification, and insulation breakdown test.',
      'Execute test charging handshake protocol with electric catamaran onboard CCS1 charging inlet port.',
      'Calibrate billing meter, RFID authentication reader, and remote telemetry reporting software dashboard.'
    ] 
  }
];

function App() {
  const [catBranches, setCatBranches] = createSignal(INITIAL_CATAMARAN_BRANCHES);
  const [pierBranches, setPierBranches] = createSignal(INITIAL_PIER_BRANCHES);
  const [globalProgress, setGlobalProgress] = createSignal('');
  const [isCompiling, setIsCompiling] = createSignal(false);
  const [compileProgressText, setCompileProgressText] = createSignal('');
  
  // Modal state
  const [modalItem, setModalItem] = createSignal(null);
  const [modalDomain, setModalDomain] = createSignal(null);
  const [modalParams, setModalParams] = createSignal({});

  const openModal = (domain, item) => {
    setModalDomain(domain);
    setModalItem(item);
    setModalParams({ ...(item.parameters || {}) });
  };

  const closeModal = () => {
    setModalItem(null);
    setModalDomain(null);
    setModalParams({});
  };

  const handleParamChange = (key, value) => {
    setModalParams(prev => ({ ...prev, [key]: value }));
  };

  const downloadTemplateFile = (item) => {
    const paramSummary = Object.entries(modalParams())
      .map(([k, v]) => `  - ${k}: ${v}`)
      .join('\n');

    const fileContent = `=== DESIGN SPECIFICATION & BUILD PARAMETERS TEMPLATE ===\nArtifact: ${item.name}\nCategory: ${item.category}\nType: ${item.type}\nTimestamp: ${new Date().toISOString()}\n\nConfigured Parameters:\n${paramSummary}\n\n[SVG / PDF TEMPLATE VECTOR DATA]\n<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <text x="50" y="50" font-family="monospace" font-size="20" font-weight="bold">TEMPLATE: ${item.name}</text>\n  <text x="50" y="90" font-family="monospace" font-size="14" fill="#333333">Parameters Applied:</text>\n  ${Object.entries(modalParams()).map(([k, v], i) => `<text x="70" y="\${130 + (i * 30)}" font-family="monospace" font-size="12" fill="#555555">${k} =${v}</text>`).join('\n  ')}\n</svg>`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${item.name}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setGlobalProgress(`Downloaded template for ${item.name}`);
  };

  const generateIncompleteManualPdf = async () => {
    setIsCompiling(true);
    setCompileProgressText('Initializing assembly manual compilation engine...');

    await new Promise(r => setTimeout(r, 200));
    setCompileProgressText('Assembling chapters and steps...');

    const contentBody = [
      { text: 'MARINE ASSEMBLY & COMPLIANCE MANUAL (INCOMPLETE DRAFT)', fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
      { text: 'PICTORIAL ASSEMBLY & MUNICIPAL PROTOCOLS', fontSize: 10, bold: true, color: '#555', alignment: 'center', margin: [0, 0, 0, 15] },
      { text: `Generated Timestamp: ${new Date().toISOString()}`, fontSize: 8, color: '#777', alignment: 'center', margin: [0, 0, 0, 20] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#111' }], margin: [0, 0, 0, 20] },
      { text: 'SECTION 1: ELECTRIC CATAMARAN ASSEMBLY', fontSize: 14, bold: true, margin: [0, 0, 0, 10] }
    ];

    await new Promise(r => setTimeout(r, 200));
    setCompileProgressText('Formatting Electric Catamaran sequential chapters...');

    catBranches().forEach((b, idx) => {
      const isUploaded = b.status === 'Uploaded & Verified';
      const stepNum = `0${idx + 1}`.slice(-2);

      contentBody.push({
        table: {
          widths: [45, '*'],
          body: [
            [
              { text: `STEP\n${stepNum}`, fontSize: 12, bold: true, alignment: 'center', fillColor: '#111', color: '#fff', margin: [4, 12, 4, 12] },
              {
                stack: [
                  { text: `${b.branch.toUpperCase()}`, fontSize: 11, bold: true, color: '#111', margin: [0, 0, 0, 2] },
                  { text: `File: ${b.name} | Type: ${b.type} | Category: ${b.category}`, fontSize: 8, color: '#555', margin: [0, 0, 0, 6] },
                  { 
                    text: b.tasks.map((t, ti) => `  [${ti + 1}] ${t}`).join('\n'), 
                    fontSize: 8, 
                    font: 'Helvetica', 
                    color: '#222', 
                    margin: [0, 0, 0, 6] 
                  },
                  isUploaded ? {
                    text: `[VERIFIED ARTIFACT LOADED]\n${b.content.substring(0, 140)}...`,
                    fontSize: 7,
                    font: 'Courier',
                    color: '#065f46',
                    fillColor: '#ecfdf5',
                    margin: [0, 2, 0, 0]
                  } : {
                    text: `[PENDING ARTIFACT]\nDownload template, configure parameters, and upload. Task focus: ${b.tasks[0]}`,
                    fontSize: 8,
                    bold: true,
                    color: '#991b1b',
                    fillColor: '#fef2f2',
                    margin: [0, 2, 0, 0]
                  }
                ],
                margin: [8, 6, 8, 6]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#d4d4d8',
          vLineColor: () => '#d4d4d8',
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        },
        margin: [0, 0, 0, 12]
      });
    });

    await new Promise(r => setTimeout(r, 200));
    setCompileProgressText('Formatting Pier & Boathouse municipal chapters...');

    contentBody.push({ text: 'SECTION 2: PIER & BOATHOUSE MUNICIPAL OPERATIONS', fontSize: 14, bold: true, margin: [0, 20, 0, 10] });

    pierBranches().forEach((b, idx) => {
      const isUploaded = b.status === 'Uploaded & Verified';
      const stepNum = `0${idx + 1}`.slice(-2);

      contentBody.push({
        table: {
          widths: [45, '*'],
          body: [
            [
              { text: `STEP\n${stepNum}`, fontSize: 12, bold: true, alignment: 'center', fillColor: '#111', color: '#fff', margin: [4, 12, 4, 12] },
              {
                stack: [
                  { text: `${b.branch.toUpperCase()}`, fontSize: 11, bold: true, color: '#111', margin: [0, 0, 0, 2] },
                  { text: `File: ${b.name} | Type: ${b.type} | Category: ${b.category}`, fontSize: 8, color: '#555', margin: [0, 0, 0, 6] },
                  { 
                    text: b.tasks.map((t, ti) => `  [${ti + 1}] ${t}`).join('\n'), 
                    fontSize: 8, 
                    font: 'Helvetica', 
                    color: '#222', 
                    margin: [0, 0, 0, 6] 
                  },
                  isUploaded ? {
                    text: `[VERIFIED ARTIFACT LOADED]\n${b.content.substring(0, 140)}...`,
                    fontSize: 7,
                    font: 'Courier',
                    color: '#065f46',
                    fillColor: '#ecfdf5',
                    margin: [0, 2, 0, 0]
                  } : {
                    text: `[PENDING ARTIFACT]\nDownload template, configure parameters, and upload. Task focus: ${b.tasks[0]}`,
                    fontSize: 8,
                    bold: true,
                    color: '#991b1b',
                    fillColor: '#fef2f2',
                    margin: [0, 2, 0, 0]
                  }
                ],
                margin: [8, 6, 8, 6]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#d4d4d8',
          vLineColor: () => '#d4d4d8',
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        },
        margin: [0, 0, 0, 12]
      });
    });

    await new Promise(r => setTimeout(r, 200));
    setCompileProgressText('Triggering PDF download...');

    const docDefinition = {
      content: contentBody,
      styles: { header: { fontSize: 18, bold: true } },
      defaultStyle: { font: 'Helvetica' }
    };

    if (typeof window !== 'undefined' && window.pdfMake) {
      try {
        window.pdfMake.createPdf(docDefinition).download('incomplete_marine_assembly_manual.pdf');
      } catch (err) {
        console.error('pdfMake download error:', err);
      }
    } else {
      console.error('pdfMake is not loaded in the global window context.');
    }

    await new Promise(r => setTimeout(r, 200));
    setIsCompiling(false);
    setCompileProgressText('');
  };

  const handleFileUpload = (domain, id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target.result;
      if (domain === 'catamaran') {
        setCatBranches(catBranches().map(b => b.id === id ? { 
          ...b, 
          name: file.name, 
          content: fileContent, 
          status: 'Uploaded & Verified' 
        } : b));
      } else {
        setPierBranches(pierBranches().map(b => b.id === id ? { 
          ...b, 
          name: file.name, 
          content: fileContent, 
          status: 'Uploaded & Verified' 
        } : b));
      }
    };
    reader.readAsText(file);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    const catFolder = zip.folder("catamaran_detailed_artifacts");
    catBranches().forEach((b) => {
      catFolder.file(b.name, b.content);
      catFolder.file(`${b.name}.instructions.txt`, `DETAILED TASK BREAKDOWN:\n${b.tasks.join('\n')}`);
    });

    const pierFolder = zip.folder("pier_detailed_artifacts");
    pierBranches().forEach((b) => {
      pierFolder.file(b.name, b.content);
      pierFolder.file(`${b.name}.instructions.txt`, `DETAILED TASK BREAKDOWN:\n${b.tasks.join('\n')}`);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprehensive_marine_package.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateProgress = (branches) => {
    const uploaded = branches.filter(b => b.status === 'Uploaded & Verified').length;
    return Math.round((uploaded / branches.length) * 100);
  };

  return (
    <div class="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-950 selection:text-white pb-20 relative">
      
      {/* Parameter Configuration & Template Download Modal */}
      {modalItem() && (
        <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div class="bg-white border border-zinc-200 rounded-lg p-6 max-w-lg w-full shadow-xl space-y-5">
            <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-900 text-white px-1.5 py-0.5 rounded mr-2">{modalItem().type}</span>
                <h3 class="text-sm font-semibold text-zinc-900 inline">{modalItem().branch}</h3>
              </div>
              <button onClick={closeModal} class="text-zinc-400 hover:text-zinc-700 text-xs font-mono">✕</button>
            </div>

            <p class="text-xs text-zinc-600">
              Configure your build parameters and design decisions below, then click <strong>Download Template</strong> to export the serialized template file for filing and verification.
            </p>

            <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
              <For each={Object.keys(modalParams())}>
                {(paramKey) => (
                  <div>
                    <label class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">{paramKey}</label>
                    <input 
                      type="text" 
                      value={modalParams()[paramKey]} 
                      onInput={(e) => handleParamChange(paramKey, e.target.value)}
                      class="w-full text-xs font-mono bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                )}
              </For>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button 
                onClick={closeModal} 
                class="border border-zinc-300 text-zinc-700 text-xs font-medium px-3.5 py-1.5 rounded hover:bg-zinc-50 transition">
                Close
              </button>
              <button 
                onClick={() => downloadTemplateFile(modalItem())} 
                class="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-4 py-1.5 rounded transition">
                Download Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compilation Modal */}
      {isCompiling() && (
        <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div class="bg-white border border-zinc-200 rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-zinc-900">Compiling Incomplete Assembly Manual</h3>
              <div class="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p class="text-xs font-mono text-zinc-600 bg-zinc-50 p-3 rounded border border-zinc-200">
              {compileProgressText()}
            </p>
            <div class="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
              <div class="bg-zinc-900 h-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      )}

      <div class="max-w-7xl mx-auto px-6 pt-8">
        
        {/* Header */}
        <header class="mb-6 border-b border-zinc-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p class="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-0.5">Comprehensive Industrial & Municipal Pipeline</p>
            <h1 class="text-xl font-semibold tracking-tight">Compliance Verifier & Instructive Manual Dashboard</h1>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button 
              onClick={generateIncompleteManualPdf}
              disabled={isCompiling()}
              class="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-medium px-3.5 py-1.5 rounded transition flex items-center gap-2">
              {isCompiling() ? 'Compiling Manual...' : 'Download Incomplete Manual (.pdf)'}
            </button>
            <button 
              onClick={downloadZip}
              class="border border-zinc-300 hover:border-zinc-400 text-zinc-700 text-xs font-medium px-3.5 py-1.5 rounded transition">
              Export .ZIP
            </button>
          </div>
        </header>

        {globalProgress() && (
          <div class="mb-4 text-xs font-mono text-zinc-600 bg-zinc-50 border border-zinc-200 p-2.5 rounded-md">
            {globalProgress()}
          </div>
        )}

        {/* Two-Column Responsive Layout with Hidden Scroll */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Column 1: Electric Catamaran */}
          <div class="border border-zinc-200 rounded-lg p-5 bg-white shadow-xs flex flex-col h-[75vh]">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 flex-shrink-0">
              <div>
                <h2 class="text-sm font-semibold text-zinc-900">Electric Catamaran Manufacturing</h2>
                <p class="text-[11px] text-zinc-500">Click any step to configure parameters and download templates.</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded">
                  {calculateProgress(catBranches())}% Complete
                </span>
              </div>
            </div>

            <div class="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              <For each={catBranches()}>
                {(b) => {
                  const isUploaded = b.status === 'Uploaded & Verified';
                  return (
                    <div 
                      onClick={() => openModal('catamaran', b)}
                      class="border-l-2 border-zinc-200 hover:border-zinc-900 pl-4 py-2 space-y-2 cursor-pointer transition group">
                      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                              {b.category}
                            </span>
                            <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                              {b.type}
                            </span>
                          </div>
                          <span class="text-xs font-mono font-semibold text-zinc-800 group-hover:text-zinc-950">{b.branch}</span>
                          <p class="text-[10px] font-mono text-zinc-400 truncate max-w-xs">{b.name}</p>
                        </div>

                        <div class="flex items-center gap-2 w-full sm:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                          {isUploaded && (
                            <span class="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Uploaded & Verified
                            </span>
                          )}
                          <label class="cursor-pointer border border-zinc-200 hover:border-zinc-300 text-zinc-700 px-2.5 py-1 rounded text-[11px] transition bg-white">
                            Upload File
                            <input type="file" onChange={(e) => handleFileUpload('catamaran', b.id, e)} class="hidden" />
                          </label>
                        </div>
                      </div>

                      <ul class="space-y-1.5 mt-2">
                        <For each={b.tasks}>
                          {(task, ti) => (
                            <li class="text-[11px] text-zinc-600 flex items-start gap-2">
                              <span class="flex-shrink-0 font-mono text-[10px] text-zinc-400 mt-0.5">0{ti() + 1}.</span>
                              <span>{task}</span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          {/* Column 2: Pier & Boathouse Operations */}
          <div class="border border-zinc-200 rounded-lg p-5 bg-white shadow-xs flex flex-col h-[75vh]">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 flex-shrink-0">
              <div>
                <h2 class="text-sm font-semibold text-zinc-900">Pier & Boathouse Operations</h2>
                <p class="text-[11px] text-zinc-500">Click any step to configure parameters and download templates.</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded">
                  {calculateProgress(pierBranches())}% Complete
                </span>
              </div>
            </div>

            <div class="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              <For each={pierBranches()}>
                {(b) => {
                  const isUploaded = b.status === 'Uploaded & Verified';
                  return (
                    <div 
                      onClick={() => openModal('pier', b)}
                      class="border-l-2 border-zinc-200 hover:border-zinc-900 pl-4 py-2 space-y-2 cursor-pointer transition group">
                      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                              {b.category}
                            </span>
                            <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                              {b.type}
                            </span>
                          </div>
                          <span class="text-xs font-mono font-semibold text-zinc-800 group-hover:text-zinc-950">{b.branch}</span>
                          <p class="text-[10px] font-mono text-zinc-400 truncate max-w-xs">{b.name}</p>
                        </div>

                        <div class="flex items-center gap-2 w-full sm:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                          {isUploaded && (
                            <span class="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Uploaded & Verified
                            </span>
                          )}
                          <label class="cursor-pointer border border-zinc-200 hover:border-zinc-300 text-zinc-700 px-2.5 py-1 rounded text-[11px] transition bg-white">
                            Upload File
                            <input type="file" onChange={(e) => handleFileUpload('pier', b.id, e)} class="hidden" />
                          </label>
                        </div>
                      </div>

                      <ul class="space-y-1.5 mt-2">
                        <For each={b.tasks}>
                          {(task, ti) => (
                            <li class="text-[11px] text-zinc-600 flex items-start gap-2">
                              <span class="flex-shrink-0 font-mono text-[10px] text-zinc-400 mt-0.5">0{ti() + 1}.</span>
                              <span>{task}</span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

render(() => <App />, document.getElementById('root'));