// ======================================================
//  App.DefaultData  —  Sample dataset loader
//  Loads on first run when DB is empty
//  500 students · 20 teachers · ~$9,750 raised
// ======================================================

window.App = window.App || {};
App.DefaultData = {};

(function () {

    const ROSTER_CSV = `Student Name,Teacher
Amelia Robinson,Mr. Bennett
Dylan Ortiz,Mr. Bennett
Elijah Garcia,Mr. Bennett
Evan Liu,Mr. Bennett
Evelyn Long,Mr. Bennett
Finn Nguyen,Mr. Bennett
Hannah Hamilton,Mr. Bennett
Hunter Brooks,Mr. Bennett
Isaac Singh,Mr. Bennett
Jackson Carter,Mr. Bennett
James Coleman,Mr. Bennett
Jaxon Hassan,Mr. Bennett
Josh Bell,Mr. Bennett
Lily Lee,Mr. Bennett
Luke Barnes,Mr. Bennett
Matthew Hassan,Mr. Bennett
Naomi Carter,Mr. Bennett
Piper Hernandez,Mr. Bennett
Savannah Butler,Mr. Bennett
Seraphina Lewis,Mr. Bennett
Thomas Lee,Mr. Bennett
Violet Cruz,Mr. Bennett
Willow Rivera,Mr. Bennett
Wyatt Brooks,Mr. Bennett
Zoe Hernandez,Mr. Bennett
Aiden Gutierrez,Mr. Davis
Amelia Walker,Mr. Davis
Andrew Cooper,Mr. Davis
Anthony Diaz,Mr. Davis
Ava Anderson,Mr. Davis
Emma Henderson,Mr. Davis
Emma Myers,Mr. Davis
Ezra Reynolds,Mr. Davis
Felix Jordan,Mr. Davis
Finn Singh,Mr. Davis
Hazel Walker,Mr. Davis
Henry Coleman,Mr. Davis
John Diaz,Mr. Davis
Layla Martin,Mr. Davis
Nathan Anderson,Mr. Davis
Olivia Gutierrez,Mr. Davis
Owen Bennett,Mr. Davis
Paisley Ward,Mr. Davis
Peyton Ali,Mr. Davis
Savannah Hamilton,Mr. Davis
Sebastian Patel,Mr. Davis
Silas Hernandez,Mr. Davis
Stella Liu,Mr. Davis
Victoria Bell,Mr. Davis
Violet Shah,Mr. Davis
Aaliyah Rivera,Mr. Fitzgerald
Athena Gonzalez,Mr. Fitzgerald
Audrey Gupta,Mr. Fitzgerald
Aurora Nguyen,Mr. Fitzgerald
Autumn Rogers,Mr. Fitzgerald
Axel Kelly,Mr. Fitzgerald
Charlotte Sullivan,Mr. Fitzgerald
David Peterson,Mr. Fitzgerald
Elizabeth Gonzalez,Mr. Fitzgerald
Felix Bailey,Mr. Fitzgerald
Iris Liu,Mr. Fitzgerald
Jackson Davis,Mr. Fitzgerald
Jeremiah Coleman,Mr. Fitzgerald
Jonathan Singh,Mr. Fitzgerald
Kennedy Ramirez,Mr. Fitzgerald
Kinsley Harris,Mr. Fitzgerald
Kinsley Ward,Mr. Fitzgerald
Lily Kim,Mr. Fitzgerald
Lucas Reed,Mr. Fitzgerald
Luke Harris,Mr. Fitzgerald
Luna Perez,Mr. Fitzgerald
Naomi Young,Mr. Fitzgerald
Noah Lopez,Mr. Fitzgerald
Oliver Jenkins,Mr. Fitzgerald
Penelope Scott,Mr. Fitzgerald
Santiago Chen,Mr. Fitzgerald
Sebastian Young,Mr. Fitzgerald
Abigail Morgan,Mr. Harris
Adrian Shah,Mr. Harris
Anthony Murphy,Mr. Harris
Anthony Taylor,Mr. Harris
Ariana Green,Mr. Harris
Caroline Li,Mr. Harris
Cole Barnes,Mr. Harris
Elijah Shah,Mr. Harris
Ellie Hassan,Mr. Harris
Ellie Walker,Mr. Harris
Evelyn Brooks,Mr. Harris
Evelyn Johnson,Mr. Harris
Hunter Sanders,Mr. Harris
Leah Lee,Mr. Harris
Lily Mitchell,Mr. Harris
Natalie Clark,Mr. Harris
Nora Diaz,Mr. Harris
Peyton Johnson,Mr. Harris
Roman Reyes,Mr. Harris
Samuel Ortiz,Mr. Harris
Stella Bell,Mr. Harris
Theodore Foster,Mr. Harris
Vera Gonzalez,Mr. Harris
Carter Hassan,Mr. Jefferson
Elena Lewis,Mr. Jefferson
Hannah Lewis,Mr. Jefferson
Hazel Zhang,Mr. Jefferson
Hunter Hall,Mr. Jefferson
Jace Kumar,Mr. Jefferson
Jayden Wang,Mr. Jefferson
John Shah,Mr. Jefferson
John Simmons,Mr. Jefferson
Julian Ortiz,Mr. Jefferson
Julian Wright,Mr. Jefferson
Kinsley Sanders,Mr. Jefferson
Luna Singh,Mr. Jefferson
Michael Kim,Mr. Jefferson
Mila Rivera,Mr. Jefferson
Miles Brown,Mr. Jefferson
Miles Nguyen,Mr. Jefferson
Nolan Clark,Mr. Jefferson
Owen Nguyen,Mr. Jefferson
Sebastian Carter,Mr. Jefferson
Sophia Russell,Mr. Jefferson
Victoria Kim,Mr. Jefferson
William Wu,Mr. Jefferson
Aaliyah Kim,Mr. Larson
Aaron Jenkins,Mr. Larson
Andrew Gray,Mr. Larson
Caleb Lewis,Mr. Larson
Chloe Foster,Mr. Larson
Christopher Clark,Mr. Larson
Connor Reed,Mr. Larson
Emma Hill,Mr. Larson
Henry Torres,Mr. Larson
Jeremiah Butler,Mr. Larson
Jeremiah Gray,Mr. Larson
Jordan Ortiz,Mr. Larson
Kinsley Adams,Mr. Larson
Layla Jackson,Mr. Larson
Luna Jenkins,Mr. Larson
Michael Lopez,Mr. Larson
Nevaeh Flores,Mr. Larson
Nora Richardson,Mr. Larson
Nova Long,Mr. Larson
Paisley Gomez,Mr. Larson
Santiago Pham,Mr. Larson
Silas Hill,Mr. Larson
Sofia Harris,Mr. Larson
Sophie Russell,Mr. Larson
Wyatt Russell,Mr. Larson
Addison Bennett,Mr. Nguyen
Ariana Ward,Mr. Nguyen
Axel Carter,Mr. Nguyen
Benjamin Clark,Mr. Nguyen
Brooklyn Hamilton,Mr. Nguyen
Caroline Martinez,Mr. Nguyen
Carter Barnes,Mr. Nguyen
Charles Wu,Mr. Nguyen
Christopher Walker,Mr. Nguyen
David Martin,Mr. Nguyen
Easton Smith,Mr. Nguyen
Ethan Wu,Mr. Nguyen
Gabriel Scott,Mr. Nguyen
Iris Hernandez,Mr. Nguyen
Isaac Roberts,Mr. Nguyen
Jaxon Nelson,Mr. Nguyen
Jonathan Morgan,Mr. Nguyen
Jordan Brooks,Mr. Nguyen
Jordan Roberts,Mr. Nguyen
Julian Liu,Mr. Nguyen
Landon King,Mr. Nguyen
Nora Rodriguez,Mr. Nguyen
Roman Butler,Mr. Nguyen
Ryan Sharma,Mr. Nguyen
Sadie Rogers,Mr. Nguyen
Skylar Hill,Mr. Nguyen
Aiden Graham,Mr. Patel
Aiden Reyes,Mr. Patel
Avery Pham,Mr. Patel
Caleb Cruz,Mr. Patel
Carter Walker,Mr. Patel
Ethan Sanders,Mr. Patel
Grayson Gomez,Mr. Patel
Julian Sanchez,Mr. Patel
Layla Martinez,Mr. Patel
Lily Wilson,Mr. Patel
Mateo Hamilton,Mr. Patel
Mia Hall,Mr. Patel
Nevaeh Powell,Mr. Patel
Owen Flores,Mr. Patel
Piper Murphy,Mr. Patel
Rowan Peterson,Mr. Patel
Sebastian Hughes,Mr. Patel
Sofia Kelly,Mr. Patel
Sophia Hassan,Mr. Patel
Theodore Yang,Mr. Patel
Vera Kim,Mr. Patel
Willow Perez,Mr. Patel
Willow Rodriguez,Mr. Patel
Andrew Lewis,Mr. Rodriguez
Anna Myers,Mr. Rodriguez
Athena Nelson,Mr. Rodriguez
Autumn Patterson,Mr. Rodriguez
Ava Lopez,Mr. Rodriguez
Avery Patterson,Mr. Rodriguez
Felix Reynolds,Mr. Rodriguez
Gabriel Perry,Mr. Rodriguez
Genesis Wright,Mr. Rodriguez
Grayson Simmons,Mr. Rodriguez
Hazel Allen,Mr. Rodriguez
Henry Walker,Mr. Rodriguez
Isaac Thomas,Mr. Rodriguez
Jack Harris,Mr. Rodriguez
Jeremiah Perry,Mr. Rodriguez
Kennedy Scott,Mr. Rodriguez
Lily Flores,Mr. Rodriguez
Luke Green,Mr. Rodriguez
Nova Mitchell,Mr. Rodriguez
Peyton Hall,Mr. Rodriguez
Samantha Bailey,Mr. Rodriguez
Santiago Powell,Mr. Rodriguez
Seraphina Reynolds,Mr. Rodriguez
Skylar Butler,Mr. Rodriguez
Aaron Bailey,Mr. Thompson
Abigail Lee,Mr. Thompson
Aiden Bennett,Mr. Thompson
Anthony Kim,Mr. Thompson
Aria Martinez,Mr. Thompson
Benjamin Foster,Mr. Thompson
Benjamin Perez,Mr. Thompson
Christopher Barnes,Mr. Thompson
Connor Hill,Mr. Thompson
Dylan Ross,Mr. Thompson
Elena Nguyen,Mr. Thompson
Eli Flores,Mr. Thompson
Finn Martinez,Mr. Thompson
Gabriel Thompson,Mr. Thompson
Genesis Martinez,Mr. Thompson
Isaac Hassan,Mr. Thompson
Isabella Robinson,Mr. Thompson
Jackson Reynolds,Mr. Thompson
Kinsley Bailey,Mr. Thompson
Layla Peterson,Mr. Thompson
Leah Butler,Mr. Thompson
Levi Powell,Mr. Thompson
Nora King,Mr. Thompson
Savannah Zhang,Mr. Thompson
Scarlett Khan,Mr. Thompson
Silas Sanders,Mr. Thompson
Victoria Smith,Mr. Thompson
Alexander Carter,Ms. Anderson
Aurora Wilson,Ms. Anderson
Autumn Baker,Ms. Anderson
Autumn Jones,Ms. Anderson
Brooklyn Young,Ms. Anderson
Claire Long,Ms. Anderson
Cole Lopez,Ms. Anderson
Cole Morgan,Ms. Anderson
Elizabeth Rivera,Ms. Anderson
Grayson Reynolds,Ms. Anderson
Grayson Robinson,Ms. Anderson
Josh Chen,Ms. Anderson
Josh Martin,Ms. Anderson
Layla Fisher,Ms. Anderson
Levi Moore,Ms. Anderson
Liam Reynolds,Ms. Anderson
Mason Lopez,Ms. Anderson
Mila Jenkins,Ms. Anderson
Nevaeh Long,Ms. Anderson
Sophia James,Ms. Anderson
Sophia Simmons,Ms. Anderson
Victoria Butler,Ms. Anderson
Zoey Bailey,Ms. Anderson
Aaron Myers,Ms. Chen
Anthony Moore,Ms. Chen
Anthony Patterson,Ms. Chen
Autumn Myers,Ms. Chen
Charlotte Singh,Ms. Chen
David Richardson,Ms. Chen
Ella Martin,Ms. Chen
Ellie Cook,Ms. Chen
Ellie Ramirez,Ms. Chen
Gavin Lopez,Ms. Chen
Harper Roberts,Ms. Chen
Hunter Jackson,Ms. Chen
Jace Brooks,Ms. Chen
Jasmine Murphy,Ms. Chen
Jonathan Watson,Ms. Chen
Julian Patterson,Ms. Chen
Nora Khan,Ms. Chen
Roman Cook,Ms. Chen
Roman Peterson,Ms. Chen
Savannah Rodriguez,Ms. Chen
Silas Shah,Ms. Chen
Victoria Pham,Ms. Chen
Violet Lewis,Ms. Chen
Addison Martinez,Ms. Edwards
Aurora Williams,Ms. Edwards
Autumn Ramirez,Ms. Edwards
Avery Young,Ms. Edwards
Benjamin Robinson,Ms. Edwards
Bentley Ramirez,Ms. Edwards
Caleb Cook,Ms. Edwards
Eliana Bailey,Ms. Edwards
Elijah Gupta,Ms. Edwards
Elijah Reynolds,Ms. Edwards
Evelyn Barnes,Ms. Edwards
Ezra Reed,Ms. Edwards
Finn Robinson,Ms. Edwards
Grace King,Ms. Edwards
Iris Jordan,Ms. Edwards
Iris Taylor,Ms. Edwards
Isabella Singh,Ms. Edwards
Jayden Fisher,Ms. Edwards
Josh Ortiz,Ms. Edwards
Levi Rodriguez,Ms. Edwards
Peyton Patel,Ms. Edwards
Rowan Hamilton,Ms. Edwards
Santiago Gray,Ms. Edwards
Sofia Taylor,Ms. Edwards
Sophie Walker,Ms. Edwards
Zoey Smith,Ms. Edwards
Abigail Yang,Ms. Gonzalez
Amelia Richardson,Ms. Gonzalez
Anthony Hassan,Ms. Gonzalez
Autumn Butler,Ms. Gonzalez
Avery Kumar,Ms. Gonzalez
Bentley Martin,Ms. Gonzalez
Charlotte Hughes,Ms. Gonzalez
Easton Diaz,Ms. Gonzalez
Elijah Jenkins,Ms. Gonzalez
Ellie Davis,Ms. Gonzalez
Emma Roberts,Ms. Gonzalez
Genesis Torres,Ms. Gonzalez
Grace Carter,Ms. Gonzalez
Grayson Davis,Ms. Gonzalez
Iris Davis,Ms. Gonzalez
Jack Rodriguez,Ms. Gonzalez
Luna Cook,Ms. Gonzalez
Nova Myers,Ms. Gonzalez
Nova Simmons,Ms. Gonzalez
Peyton Lee,Ms. Gonzalez
Riley Nguyen,Ms. Gonzalez
Seraphina Russell,Ms. Gonzalez
Silas Young,Ms. Gonzalez
Aaliyah Taylor,Ms. Ibrahim
Aiden Kumar,Ms. Ibrahim
Anthony Lee,Ms. Ibrahim
Autumn Li,Ms. Ibrahim
Brooklyn Garcia,Ms. Ibrahim
Camila King,Ms. Ibrahim
Connor Gray,Ms. Ibrahim
Dylan Fisher,Ms. Ibrahim
Eli James,Ms. Ibrahim
Emma Nelson,Ms. Ibrahim
Finn Jackson,Ms. Ibrahim
Finn Martin,Ms. Ibrahim
Jaxon Torres,Ms. Ibrahim
Lucas Kumar,Ms. Ibrahim
Mia Flores,Ms. Ibrahim
Mila Shah,Ms. Ibrahim
Nathan Clark,Ms. Ibrahim
Oliver Lopez,Ms. Ibrahim
Olivia Anderson,Ms. Ibrahim
Samantha Allen,Ms. Ibrahim
Samuel Morales,Ms. Ibrahim
Scarlett Bennett,Ms. Ibrahim
Sebastian Patterson,Ms. Ibrahim
Stella Ahmed,Ms. Ibrahim
Thomas Gupta,Ms. Ibrahim
William Li,Ms. Ibrahim
Willow Hughes,Ms. Ibrahim
Aaliyah Rodriguez,Ms. Kowalski
Addison Sanders,Ms. Kowalski
Ariana Hassan,Ms. Kowalski
Audrey Nelson,Ms. Kowalski
Axel Harris,Ms. Kowalski
Elijah Hamilton,Ms. Kowalski
Ellie Cooper,Ms. Kowalski
Ellie Russell,Ms. Kowalski
Felix Gutierrez,Ms. Kowalski
Felix Nelson,Ms. Kowalski
Josh Hall,Ms. Kowalski
Josh Singh,Ms. Kowalski
Layla Campbell,Ms. Kowalski
Mackenzie Anderson,Ms. Kowalski
Mackenzie Cook,Ms. Kowalski
Mason Anderson,Ms. Kowalski
Mateo Garcia,Ms. Kowalski
Matthew Henderson,Ms. Kowalski
Maya Gupta,Ms. Kowalski
Natalie Thompson,Ms. Kowalski
Nicholas Hall,Ms. Kowalski
Nicholas Smith,Ms. Kowalski
Nova King,Ms. Kowalski
William Wilson,Ms. Kowalski
Athena Bailey,Ms. Mitchell
Audrey Young,Ms. Mitchell
Autumn Lewis,Ms. Mitchell
Camila Nguyen,Ms. Mitchell
Charlotte James,Ms. Mitchell
Connor Foster,Ms. Mitchell
Eliana Gomez,Ms. Mitchell
Evelyn Bell,Ms. Mitchell
James Young,Ms. Mitchell
John Nguyen,Ms. Mitchell
Joseph Sullivan,Ms. Mitchell
Julian Ali,Ms. Mitchell
Liam Sharma,Ms. Mitchell
Matthew Bell,Ms. Mitchell
Maya Cox,Ms. Mitchell
Naomi Ortiz,Ms. Mitchell
Nevaeh Peterson,Ms. Mitchell
Peyton James,Ms. Mitchell
Ryan Jordan,Ms. Mitchell
Sadie Kumar,Ms. Mitchell
Santiago Foster,Ms. Mitchell
Sebastian Graham,Ms. Mitchell
Victoria Patterson,Ms. Mitchell
Aaron Adams,Ms. O'Brien
Aaron Scott,Ms. O'Brien
Abigail Kelly,Ms. O'Brien
Adrian Lewis,Ms. O'Brien
Aurora Ortiz,Ms. O'Brien
Ava Patterson,Ms. O'Brien
Bella Price,Ms. O'Brien
Charlotte King,Ms. O'Brien
Eli Moore,Ms. O'Brien
Elijah Graham,Ms. O'Brien
Evan Baker,Ms. O'Brien
Grace Liu,Ms. O'Brien
Iris Miller,Ms. O'Brien
Jeremiah Henderson,Ms. O'Brien
Jonathan Ali,Ms. O'Brien
Jordan Allen,Ms. O'Brien
Mason Roberts,Ms. O'Brien
Mia Jordan,Ms. O'Brien
Naomi White,Ms. O'Brien
Nicholas Ward,Ms. O'Brien
Nora Bell,Ms. O'Brien
Rowan Brown,Ms. O'Brien
Sofia Sanders,Ms. O'Brien
Sophia Hernandez,Ms. O'Brien
Vera Russell,Ms. O'Brien
Zoey Ward,Ms. O'Brien
Zoey Wright,Ms. O'Brien
Aaliyah Campbell,Ms. Quinn
Aaron Baker,Ms. Quinn
Ariana Sullivan,Ms. Quinn
Brooklyn James,Ms. Quinn
Carter Cooper,Ms. Quinn
Emily Scott,Ms. Quinn
Evan White,Ms. Quinn
Felix Graham,Ms. Quinn
Hunter Barnes,Ms. Quinn
Jaxon Foster,Ms. Quinn
John Coleman,Ms. Quinn
Jordan Zhang,Ms. Quinn
Josh Shah,Ms. Quinn
Kennedy Gomez,Ms. Quinn
Landon Young,Ms. Quinn
Lily Li,Ms. Quinn
Mason Cox,Ms. Quinn
Naomi Reyes,Ms. Quinn
Natalie Baker,Ms. Quinn
Nicholas Zhang,Ms. Quinn
Noah Yang,Ms. Quinn
Olivia Wood,Ms. Quinn
Samantha Wilson,Ms. Quinn
Savannah Adams,Ms. Quinn
Skylar Nguyen,Ms. Quinn
Avery James,Ms. Santos
Axel Ross,Ms. Santos
Easton Anderson,Ms. Santos
Easton Reed,Ms. Santos
Hannah Campbell,Ms. Santos
Harper Cook,Ms. Santos
Henry Young,Ms. Santos
Jackson Li,Ms. Santos
John Hill,Ms. Santos
Leah Kelly,Ms. Santos
Levi Graham,Ms. Santos
Luke Nguyen,Ms. Santos
Nathan White,Ms. Santos
Noah Barnes,Ms. Santos
Noah Cruz,Ms. Santos
Oliver Allen,Ms. Santos
Oliver Gray,Ms. Santos
Oliver Martin,Ms. Santos
Rowan Taylor,Ms. Santos
Sadie Long,Ms. Santos
Samantha Martinez,Ms. Santos
Scarlett Chen,Ms. Santos
Sofia Morales,Ms. Santos
Vera Hill,Ms. Santos
Zoe Butler,Ms. Santos
Zara Mitchell,Ms. Anderson
Tobias Wright,Mr. Bennett
Cora Fleming,Ms. Chen
Dante Vasquez,Mr. Davis
Lyra Stone,Ms. Edwards
Reef Callahan,Mr. Fitzgerald`;

    const DONATIONS_CSV = `Student Name,Teacher,Online,Cash
Amelia Robinson,Mr. Bennett,52.95,0.00
Dylan Ortiz,Mr. Bennett,75.64,0.00
Elijah Garcia,Mr. Bennett,0.00,15.13
Evan Liu,Mr. Bennett,0.00,30.26
Evelyn Long,Mr. Bennett,22.69,15.13
Finn Nguyen,Mr. Bennett,0.00,30.26
Hannah Hamilton,Mr. Bennett,37.82,0.00
Isaac Singh,Mr. Bennett,15.13,0.00
Jackson Carter,Mr. Bennett,7.56,0.00
James Coleman,Mr. Bennett,0.00,7.56
Josh Bell,Mr. Bennett,75.64,0.00
Luke Barnes,Mr. Bennett,37.82,0.00
Matthew Hassan,Mr. Bennett,0.00,37.82
Naomi Carter,Mr. Bennett,22.69,0.00
Piper Hernandez,Mr. Bennett,15.13,15.13
Savannah Butler,Mr. Bennett,15.13,0.00
Thomas Lee,Mr. Bennett,0.00,15.13
Willow Rivera,Mr. Bennett,7.56,0.00
Wyatt Brooks,Mr. Bennett,30.26,0.00
Zoe Hernandez,Mr. Bennett,22.69,0.00
Emma Henderson,Mr. Davis,0.00,7.56
Felix Jordan,Mr. Davis,15.13,7.56
Finn Singh,Mr. Davis,0.00,15.13
Layla Martin,Mr. Davis,7.56,0.00
Olivia Gutierrez,Mr. Davis,15.13,15.13
Owen Bennett,Mr. Davis,7.56,7.57
Paisley Ward,Mr. Davis,15.13,0.00
Peyton Ali,Mr. Davis,7.56,7.57
Savannah Hamilton,Mr. Davis,22.69,30.26
Silas Hernandez,Mr. Davis,15.13,15.13
Victoria Bell,Mr. Davis,60.51,52.95
Athena Gonzalez,Mr. Fitzgerald,7.56,0.00
Autumn Rogers,Mr. Fitzgerald,0.00,7.56
Charlotte Sullivan,Mr. Fitzgerald,7.56,7.57
Iris Liu,Mr. Fitzgerald,15.13,15.13
Jackson Davis,Mr. Fitzgerald,0.00,30.26
Jonathan Singh,Mr. Fitzgerald,75.64,0.00
Kennedy Ramirez,Mr. Fitzgerald,15.13,15.13
Kinsley Ward,Mr. Fitzgerald,22.69,0.00
Lily Kim,Mr. Fitzgerald,37.82,0.00
Lucas Reed,Mr. Fitzgerald,0.00,52.95
Luke Harris,Mr. Fitzgerald,7.56,0.00
Noah Lopez,Mr. Fitzgerald,7.56,0.00
Oliver Jenkins,Mr. Fitzgerald,15.13,0.00
Santiago Chen,Mr. Fitzgerald,52.95,0.00
Sebastian Young,Mr. Fitzgerald,15.13,0.00
Abigail Morgan,Mr. Harris,15.13,0.00
Adrian Shah,Mr. Harris,37.82,0.00
Anthony Murphy,Mr. Harris,0.00,75.64
Caroline Li,Mr. Harris,15.13,15.13
Elijah Shah,Mr. Harris,7.56,0.00
Ellie Hassan,Mr. Harris,75.64,0.00
Evelyn Brooks,Mr. Harris,22.69,7.57
Evelyn Johnson,Mr. Harris,15.13,0.00
Leah Lee,Mr. Harris,15.13,0.00
Lily Mitchell,Mr. Harris,7.56,0.00
Nora Diaz,Mr. Harris,0.00,7.56
Roman Reyes,Mr. Harris,7.56,0.00
Stella Bell,Mr. Harris,0.00,37.82
Vera Gonzalez,Mr. Harris,52.95,0.00
Carter Hassan,Mr. Jefferson,15.13,0.00
Elena Lewis,Mr. Jefferson,15.13,0.00
Hannah Lewis,Mr. Jefferson,15.13,0.00
Hazel Zhang,Mr. Jefferson,113.46,0.00
Hunter Hall,Mr. Jefferson,15.13,0.00
Jayden Wang,Mr. Jefferson,22.69,30.26
John Simmons,Mr. Jefferson,15.13,0.00
Julian Ortiz,Mr. Jefferson,7.56,0.00
Miles Brown,Mr. Jefferson,45.38,30.26
Miles Nguyen,Mr. Jefferson,7.56,7.57
Owen Nguyen,Mr. Jefferson,113.46,0.00
Sebastian Carter,Mr. Jefferson,15.13,0.00
Sophia Russell,Mr. Jefferson,7.56,0.00
Aaron Jenkins,Mr. Larson,0.00,151.28
Andrew Gray,Mr. Larson,7.56,7.57
Chloe Foster,Mr. Larson,37.82,0.00
Christopher Clark,Mr. Larson,0.00,15.13
Emma Hill,Mr. Larson,7.56,0.00
Henry Torres,Mr. Larson,37.82,0.00
Jeremiah Butler,Mr. Larson,15.13,0.00
Jeremiah Gray,Mr. Larson,113.46,0.00
Jordan Ortiz,Mr. Larson,7.56,7.57
Luna Jenkins,Mr. Larson,52.95,22.69
Nevaeh Flores,Mr. Larson,15.13,15.13
Nora Richardson,Mr. Larson,15.13,0.00
Nova Long,Mr. Larson,0.00,7.56
Paisley Gomez,Mr. Larson,7.56,7.57
Sophie Russell,Mr. Larson,7.56,7.57
Wyatt Russell,Mr. Larson,7.56,22.70
Addison Bennett,Mr. Nguyen,226.92,0.00
Axel Carter,Mr. Nguyen,7.56,0.00
David Martin,Mr. Nguyen,7.56,7.57
Easton Smith,Mr. Nguyen,30.26,0.00
Ethan Wu,Mr. Nguyen,15.13,7.56
Iris Hernandez,Mr. Nguyen,15.13,15.13
Isaac Roberts,Mr. Nguyen,52.95,0.00
Jaxon Nelson,Mr. Nguyen,30.26,0.00
Jonathan Morgan,Mr. Nguyen,37.82,0.00
Jordan Brooks,Mr. Nguyen,0.00,30.26
Jordan Roberts,Mr. Nguyen,30.26,0.00
Landon King,Mr. Nguyen,7.56,15.13
Nora Rodriguez,Mr. Nguyen,0.00,22.69
Roman Butler,Mr. Nguyen,7.56,0.00
Ryan Sharma,Mr. Nguyen,15.13,7.56
Sadie Rogers,Mr. Nguyen,7.56,0.00
Aiden Graham,Mr. Patel,7.56,0.00
Caleb Cruz,Mr. Patel,52.95,0.00
Carter Walker,Mr. Patel,37.82,0.00
Julian Sanchez,Mr. Patel,30.26,0.00
Layla Martinez,Mr. Patel,22.69,15.13
Lily Wilson,Mr. Patel,30.26,0.00
Owen Flores,Mr. Patel,15.13,15.13
Piper Murphy,Mr. Patel,30.26,0.00
Rowan Peterson,Mr. Patel,30.26,0.00
Sebastian Hughes,Mr. Patel,30.26,0.00
Sofia Kelly,Mr. Patel,7.56,0.00
Theodore Yang,Mr. Patel,0.00,30.26
Willow Perez,Mr. Patel,22.69,0.00
Willow Rodriguez,Mr. Patel,0.00,30.26
Andrew Lewis,Mr. Rodriguez,30.26,0.00
Anna Myers,Mr. Rodriguez,0.00,37.82
Autumn Patterson,Mr. Rodriguez,22.69,30.26
Avery Patterson,Mr. Rodriguez,30.26,0.00
Felix Reynolds,Mr. Rodriguez,30.26,0.00
Gabriel Perry,Mr. Rodriguez,0.00,75.64
Genesis Wright,Mr. Rodriguez,151.28,0.00
Grayson Simmons,Mr. Rodriguez,22.69,0.00
Hazel Allen,Mr. Rodriguez,52.95,0.00
Henry Walker,Mr. Rodriguez,7.56,15.13
Isaac Thomas,Mr. Rodriguez,15.13,0.00
Jack Harris,Mr. Rodriguez,7.56,0.00
Jeremiah Perry,Mr. Rodriguez,15.13,0.00
Kennedy Scott,Mr. Rodriguez,7.56,0.00
Lily Flores,Mr. Rodriguez,52.95,0.00
Luke Green,Mr. Rodriguez,15.13,22.69
Nova Mitchell,Mr. Rodriguez,30.26,45.38
Peyton Hall,Mr. Rodriguez,15.13,22.69
Samantha Bailey,Mr. Rodriguez,7.56,0.00
Santiago Powell,Mr. Rodriguez,15.13,15.13
Skylar Butler,Mr. Rodriguez,0.00,22.69
Aaron Bailey,Mr. Thompson,7.56,0.00
Aiden Bennett,Mr. Thompson,7.56,0.00
Anthony Kim,Mr. Thompson,22.69,0.00
Benjamin Foster,Mr. Thompson,7.56,0.00
Christopher Barnes,Mr. Thompson,0.00,7.56
Connor Hill,Mr. Thompson,0.00,75.64
Elena Nguyen,Mr. Thompson,0.00,52.95
Genesis Martinez,Mr. Thompson,0.00,37.82
Isabella Robinson,Mr. Thompson,0.00,52.95
Leah Butler,Mr. Thompson,7.56,0.00
Silas Sanders,Mr. Thompson,0.00,37.82
Aurora Wilson,Ms. Anderson,0.00,30.26
Autumn Baker,Ms. Anderson,22.69,7.57
Brooklyn Young,Ms. Anderson,22.69,15.13
Claire Long,Ms. Anderson,37.82,0.00
Grayson Robinson,Ms. Anderson,15.13,15.13
Josh Chen,Ms. Anderson,0.00,7.56
Josh Martin,Ms. Anderson,30.26,0.00
Layla Fisher,Ms. Anderson,15.13,22.69
Mason Lopez,Ms. Anderson,7.56,22.70
Nevaeh Long,Ms. Anderson,7.56,0.00
Victoria Butler,Ms. Anderson,7.56,7.57
Zoey Bailey,Ms. Anderson,7.56,0.00
Aaron Myers,Ms. Chen,0.00,15.13
Anthony Moore,Ms. Chen,7.56,0.00
Anthony Patterson,Ms. Chen,0.00,37.82
Autumn Myers,Ms. Chen,15.13,7.56
Charlotte Singh,Ms. Chen,30.26,0.00
David Richardson,Ms. Chen,7.56,0.00
Ellie Cook,Ms. Chen,0.00,22.69
Gavin Lopez,Ms. Chen,0.00,30.26
Harper Roberts,Ms. Chen,52.95,0.00
Hunter Jackson,Ms. Chen,7.56,7.57
Jace Brooks,Ms. Chen,22.69,30.26
Jasmine Murphy,Ms. Chen,15.13,7.56
Julian Patterson,Ms. Chen,75.64,0.00
Nora Khan,Ms. Chen,22.69,15.13
Roman Peterson,Ms. Chen,7.56,7.57
Savannah Rodriguez,Ms. Chen,15.13,22.69
Victoria Pham,Ms. Chen,75.64,37.82
Aurora Williams,Ms. Edwards,15.13,22.69
Autumn Ramirez,Ms. Edwards,22.69,0.00
Avery Young,Ms. Edwards,22.69,7.57
Bentley Ramirez,Ms. Edwards,30.26,0.00
Caleb Cook,Ms. Edwards,15.13,7.56
Eliana Bailey,Ms. Edwards,30.26,0.00
Elijah Gupta,Ms. Edwards,30.26,0.00
Elijah Reynolds,Ms. Edwards,7.56,22.70
Evelyn Barnes,Ms. Edwards,7.56,0.00
Ezra Reed,Ms. Edwards,15.13,0.00
Finn Robinson,Ms. Edwards,0.00,15.13
Iris Taylor,Ms. Edwards,7.56,7.57
Isabella Singh,Ms. Edwards,0.00,52.95
Josh Ortiz,Ms. Edwards,7.56,0.00
Levi Rodriguez,Ms. Edwards,37.82,0.00
Rowan Hamilton,Ms. Edwards,30.26,0.00
Abigail Yang,Ms. Gonzalez,7.56,7.57
Amelia Richardson,Ms. Gonzalez,15.13,15.13
Anthony Hassan,Ms. Gonzalez,37.82,0.00
Bentley Martin,Ms. Gonzalez,7.56,7.57
Easton Diaz,Ms. Gonzalez,7.56,0.00
Elijah Jenkins,Ms. Gonzalez,0.00,15.13
Ellie Davis,Ms. Gonzalez,15.13,0.00
Emma Roberts,Ms. Gonzalez,15.13,0.00
Grayson Davis,Ms. Gonzalez,30.26,0.00
Iris Davis,Ms. Gonzalez,30.26,0.00
Jack Rodriguez,Ms. Gonzalez,0.00,15.13
Luna Cook,Ms. Gonzalez,30.26,0.00
Seraphina Russell,Ms. Gonzalez,7.56,0.00
Silas Young,Ms. Gonzalez,0.00,52.95
Aaliyah Taylor,Ms. Ibrahim,151.28,0.00
Aiden Kumar,Ms. Ibrahim,15.13,7.56
Anthony Lee,Ms. Ibrahim,30.26,0.00
Autumn Li,Ms. Ibrahim,7.56,0.00
Connor Gray,Ms. Ibrahim,0.00,15.13
Dylan Fisher,Ms. Ibrahim,0.00,15.13
Eli James,Ms. Ibrahim,30.26,22.69
Emma Nelson,Ms. Ibrahim,0.00,30.26
Finn Jackson,Ms. Ibrahim,15.13,0.00
Lucas Kumar,Ms. Ibrahim,0.00,113.46
Mia Flores,Ms. Ibrahim,7.56,7.57
Mila Shah,Ms. Ibrahim,151.28,0.00
Nathan Clark,Ms. Ibrahim,15.13,22.69
Oliver Lopez,Ms. Ibrahim,52.95,0.00
Samantha Allen,Ms. Ibrahim,30.26,0.00
Samuel Morales,Ms. Ibrahim,7.56,15.13
Scarlett Bennett,Ms. Ibrahim,37.82,0.00
Stella Ahmed,Ms. Ibrahim,15.13,22.69
Thomas Gupta,Ms. Ibrahim,7.56,7.57
William Li,Ms. Ibrahim,0.00,30.26
Addison Sanders,Ms. Kowalski,22.69,0.00
Ariana Hassan,Ms. Kowalski,7.56,7.57
Audrey Nelson,Ms. Kowalski,37.82,0.00
Elijah Hamilton,Ms. Kowalski,22.69,52.95
Felix Nelson,Ms. Kowalski,226.92,0.00
Josh Hall,Ms. Kowalski,15.13,15.13
Josh Singh,Ms. Kowalski,15.13,0.00
Layla Campbell,Ms. Kowalski,22.69,0.00
Mackenzie Anderson,Ms. Kowalski,0.00,15.13
Mason Anderson,Ms. Kowalski,15.13,0.00
Mateo Garcia,Ms. Kowalski,7.56,0.00
Maya Gupta,Ms. Kowalski,22.69,0.00
Natalie Thompson,Ms. Kowalski,0.00,22.69
Athena Bailey,Ms. Mitchell,0.00,7.56
Audrey Young,Ms. Mitchell,7.56,0.00
Autumn Lewis,Ms. Mitchell,0.00,15.13
Connor Foster,Ms. Mitchell,7.56,0.00
Eliana Gomez,Ms. Mitchell,15.13,0.00
Evelyn Bell,Ms. Mitchell,7.56,7.57
James Young,Ms. Mitchell,7.56,0.00
Joseph Sullivan,Ms. Mitchell,15.13,22.69
Julian Ali,Ms. Mitchell,7.56,0.00
Liam Sharma,Ms. Mitchell,0.00,15.13
Nevaeh Peterson,Ms. Mitchell,22.69,0.00
Ryan Jordan,Ms. Mitchell,0.00,7.56
Santiago Foster,Ms. Mitchell,7.56,0.00
Sebastian Graham,Ms. Mitchell,7.56,0.00
Aaron Adams,Ms. O'Brien,7.56,0.00
Bella Price,Ms. O'Brien,7.56,0.00
Charlotte King,Ms. O'Brien,15.13,0.00
Eli Moore,Ms. O'Brien,30.26,0.00
Elijah Graham,Ms. O'Brien,15.13,7.56
Evan Baker,Ms. O'Brien,0.00,75.64
Jeremiah Henderson,Ms. O'Brien,52.95,0.00
Jonathan Ali,Ms. O'Brien,37.82,0.00
Mason Roberts,Ms. O'Brien,15.13,37.82
Nicholas Ward,Ms. O'Brien,15.13,15.13
Rowan Brown,Ms. O'Brien,75.64,0.00
Sofia Sanders,Ms. O'Brien,15.13,15.13
Zoey Ward,Ms. O'Brien,0.00,30.26
Zoey Wright,Ms. O'Brien,30.26,0.00
Aaliyah Campbell,Ms. Quinn,7.56,0.00
Aaron Baker,Ms. Quinn,0.00,75.64
Brooklyn James,Ms. Quinn,15.13,15.13
Evan White,Ms. Quinn,37.82,0.00
Felix Graham,Ms. Quinn,30.26,0.00
Hunter Barnes,Ms. Quinn,7.56,15.13
Jaxon Foster,Ms. Quinn,75.64,0.00
John Coleman,Ms. Quinn,30.26,0.00
Jordan Zhang,Ms. Quinn,15.13,7.56
Josh Shah,Ms. Quinn,15.13,0.00
Kennedy Gomez,Ms. Quinn,15.13,0.00
Landon Young,Ms. Quinn,52.95,0.00
Lily Li,Ms. Quinn,37.82,0.00
Mason Cox,Ms. Quinn,22.69,0.00
Naomi Reyes,Ms. Quinn,15.13,0.00
Nicholas Zhang,Ms. Quinn,15.13,0.00
Noah Yang,Ms. Quinn,7.56,0.00
Savannah Adams,Ms. Quinn,7.56,0.00
Skylar Nguyen,Ms. Quinn,0.00,52.95
Easton Anderson,Ms. Santos,0.00,37.82
Harper Cook,Ms. Santos,7.56,7.57
John Hill,Ms. Santos,0.00,15.13
Leah Kelly,Ms. Santos,7.56,7.57
Noah Barnes,Ms. Santos,0.00,37.82
Noah Cruz,Ms. Santos,7.56,15.13
Oliver Gray,Ms. Santos,7.56,0.00
Oliver Martin,Ms. Santos,22.69,0.00
Rowan Taylor,Ms. Santos,37.82,0.00
Sadie Long,Ms. Santos,15.13,0.00
Samantha Martinez,Ms. Santos,75.64,0.00
Scarlett Chen,Ms. Santos,7.56,7.57
Sofia Morales,Ms. Santos,75.64,0.00
Vera Hill,Ms. Santos,52.95,0.00
Zoe Butler,Ms. Santos,30.26,0.00`;

    // --------------------------------------------------
    // Parse a CSV string into array of objects
    // --------------------------------------------------
    function parseCSV(text) {
        const lines  = text.trim().split(/\r?\n/);
        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        return lines.slice(1).map(line => {
            // Simple CSV parse — handles quoted fields
            const cols = [];
            let cur = "", inQ = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') { inQ = !inQ; }
                else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
                else { cur += ch; }
            }
            cols.push(cur.trim());
            const obj = {};
            headers.forEach((h, i) => { obj[h] = cols[i] || ""; });
            return obj;
        });
    }

    // --------------------------------------------------
    // Load default data — called on first DB open
    // --------------------------------------------------
    App.DefaultData.load = async function () {
        const overlay = document.getElementById("overlay");
        if (overlay) { overlay.textContent = "Loading sample data…"; overlay.style.display = "block"; }

        try {
            // --- Load roster ---
            const rosterRows = parseCSV(ROSTER_CSV);
            for (const row of rosterRows) {
                const name    = row["Student Name"]?.trim();
                const teacher = row["Teacher"]?.trim();
                if (!name || !teacher) continue;
                await App.DB.upsertStudent({ name, teacher, notes: "", exclude: false });
            }

            // --- Load donations as one batch ---
            const batchId = await App.DB.addBatch({
                filename:   "sample_donations.csv",
                importedAt: new Date().toISOString(),
                mode:       "cash-online-accumulate",
                rowCount:   0
            });

            const donRows = parseCSV(DONATIONS_CSV);
            let rowNum = 1;
            for (const row of donRows) {
                const name    = row["Student Name"]?.trim();
                const teacher = row["Teacher"]?.trim();
                const online  = parseFloat(row["Online"]  || "0") || 0;
                const cash    = parseFloat(row["Cash"]    || "0") || 0;
                if (!name || !teacher) continue;
                if (online === 0 && cash === 0) continue;

                await App.DB.addTransaction({
                    name, teacher, online, cash,
                    txDate: null,
                    notes:  "sample data",
                    rowNum: rowNum++,
                    batchId
                });
            }

            // Update batch row count
            await App.DB.updateBatch(batchId, { rowCount: rowNum - 1 });

            // Set fundraiser meta
            const meta = {
                name:      "Spring Lottery 2025",
                notes:     "Sample dataset — 500 students across 20 classes. Replace with your own data using Load School Data and Load Cash/Online.",
                createdAt: new Date().toISOString()
            };
            localStorage.setItem("slm_fundraiser_meta", JSON.stringify(meta));

        } finally {
            if (overlay) overlay.style.display = "none";
        }
    };

    // --------------------------------------------------
    // Check if DB is empty — ask user before loading sample data
    // --------------------------------------------------
    App.DefaultData.loadIfEmpty = async function () {
        const students = await App.DB.getAllStudents();
        if (students.length === 0) {
            const want = await _askLoadDefault();
            if (want) await App.DefaultData.load();
        }
    };

    function _askLoadDefault() {
        return new Promise(resolve => {
            const overlay = document.createElement("div");
            overlay.style.cssText = "position:fixed;inset:0;z-index:9900;background:rgba(15,23,42,0.85);display:flex;align-items:center;justify-content:center;padding:16px;";
            overlay.innerHTML = `
                <div style="background:#1e293b;border:1px solid rgba(255,255,255,.1);border-radius:16px;
                            padding:28px 24px;max-width:420px;width:100%;text-align:center;
                            box-shadow:0 8px 40px rgba(0,0,0,.4);color:#f1f5f9;">
                    <div style="font-size:36px;margin-bottom:12px;">🎲</div>
                    <h3 style="margin:0 0 10px;font-size:18px;">No data loaded</h3>
                    <p style="color:#94a3b8;font-size:13px;margin:0 0 24px;line-height:1.6;">
                        There is currently no loaded data.<br>
                        Would you like to load a <strong style="color:#f1f5f9;">sample dataset</strong>
                        with 500 students across 20 classes?
                    </p>
                    <div style="display:flex;gap:10px;">
                        <button id="_defaultNo"  style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);
                            background:rgba(255,255,255,.06);color:#94a3b8;cursor:pointer;font-size:13px;font-weight:500;">
                            No thanks
                        </button>
                        <button id="_defaultYes" style="flex:1;padding:10px;border-radius:8px;border:none;
                            background:#2563eb;color:#fff;cursor:pointer;font-size:13px;font-weight:700;">
                            Load sample data
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector("#_defaultYes").onclick = () => { document.body.removeChild(overlay); resolve(true);  };
            overlay.querySelector("#_defaultNo").onclick  = () => { document.body.removeChild(overlay); resolve(false); };
        });
    }

})();
