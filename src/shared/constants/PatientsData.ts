export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return (first + last).toUpperCase();
  }
  return fullName.slice(0, 2).toUpperCase();
}

export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  address: string | null;
  is_complete_profile: boolean;
  initials: string;
  last_visit: string | null;
}

function makePatient(
  id: string,
  full_name: string,
  phone: string,
  age: number,
  gender: "Male" | "Female" | "Other",
  address: string,
  last_visit: string,
  is_complete_profile = true,
): Patient {
  return {
    id,
    full_name,
    phone,
    age,
    gender,
    address,
    last_visit,
    initials: getInitials(full_name),
    is_complete_profile,
  };
}

export const ALL_PATIENTS: Patient[] = [
  makePatient("KD-2024-041", "Ayesha Jahan", "+880 1712-345678", 32, "Female", "House 12, Road 5, Block C, Banani", "2023-10-12"),
  makePatient("KD-2024-022", "Rahat Khan", "+880 1911-987654", 45, "Male", "Flat 4B, Plot 22, Uttara Sec 7", "2024-01-05"),
  makePatient("KD-2024-089", "Sajid Bin Hasan", "+880 1675-112233", 12, "Male", "142 Green Road, Dhanmondi", "2024-02-18"),
  makePatient("KD-2024-112", "Mst. Lucky Akter", "+880 1819-001122", 28, "Female", "Bashundhara R/A, Block D", "2024-03-01"),
  makePatient("KD-2024-015", "Abdul Malek Sheikh", "+880 1555-223344", 54, "Male", "23 Azimpur, New Market Area", "2024-02-20"),
  makePatient("KD-2024-063", "Fatima Sultana", "+880 1567-889900", 29, "Female", "Flat 11A, Old DOHS, Dhaka", "2024-01-14"),
  makePatient("KD-2024-037", "Mohammad Rahim Uddin", "+880 1712-776655", 47, "Male", "Purana Paltan, DIT Bhaban", "2023-12-05"),
  makePatient("KD-2024-098", "Nasreen Akter", "+880 1810-334455", 36, "Female", "Moghbazar, Malibag Cross", "2024-02-28"),
  makePatient("KD-2024-054", "Jahangir Alam", "+880 1912-778899", 41, "Male", "House 34, Mirpur DOHS", "2024-01-22"),
  makePatient("KD-2024-081", "Rafia Khatun", "+880 1612-667788", 25, "Female", "Sector 9, Uttara Model Town", "2024-03-10"),
  makePatient("KD-2024-013", "Shariful Islam", "+880 1522-112233", 49, "Male", "Dhanmondi Road 27/A", "2023-11-30"),
  makePatient("KD-2024-076", "Kaniz Fatima", "+880 1844-998877", 33, "Female", "Karwan Bazar Road 2", "2024-02-15", false),
  makePatient("KD-2024-029", "Habib Ullah", "+880 1799-665544", 39, "Male", "Gulshan 2, 23rd Lane", "2024-01-08"),
  makePatient("KD-2024-104", "Sabina Yasmin", "+880 1715-443322", 27, "Female", "Tejgaon I/A, Agargaon", "2024-03-05"),
  makePatient("KD-2024-051", "Amir Hamja", "+880 1922-998877", 60, "Male", "Wari, Revenue Building Area", "2023-12-18"),
  makePatient("KD-2024-090", "Rehana Parveen", "+880 1888-334466", 51, "Female", "Mohammadpur, Block G", "2024-02-10", false),
  makePatient("KD-2024-066", "Tariqul Islam", "+880 1600-119922", 44, "Male", "Rampura, Banasree Road", "2024-01-29"),
  makePatient("KD-2024-118", "Sharmin Aktar", "+880 1533-445566", 31, "Female", "Shahjadpur, Gulshan Link", "2024-03-02"),
  makePatient("KD-2024-047", "Masud Rana", "+880 1988-112233", 38, "Male", "Malibagh Chowdhury Para", "2024-02-14"),
  makePatient("KD-2024-033", "Alia Quddus", "+880 1812-887766", 26, "Female", "Bonoshri, Notun Bazar", "2024-03-08"),
  makePatient("KD-2024-072", "Jamal Uddin", "+880 1766-554433", 52, "Male", "Narayanganj, Fatullah Bazar", "2023-12-22"),
  makePatient("KD-2024-095", "Esha Akter", "+880 1615-778899", 23, "Female", "Pallabi, Signature Tower", "2024-03-12", false),
  makePatient("KD-2024-011", "Fahim Ahmed", "+880 1910-445566", 34, "Male", "Uttara Sector 11, House 5", "2024-01-03"),
  makePatient("KD-2024-085", "Taslima Begum", "+880 1833-601122", 42, "Female", "Jatrabari, East Hazaribagh", "2024-02-07"),
  makePatient("KD-2024-060", "Anwar Hossain", "+880 1599-667788", 56, "Male", "Keraniganj, Bangladesh T&T", "2023-12-29"),
  makePatient("KD-2024-122", "Mehejaben Chowdhury", "+880 1744-229977", 29, "Female", "Dhanmondi Road 8, Apt 4C", "2024-03-14"),
  makePatient("KD-2024-044", "Saiful Kibria", "+880 1955-773322", 48, "Male", "Mirpur 10, Lake Circuit", "2023-11-20"),
  makePatient("KD-2024-099", "Anika Sultana", "+880 1877-331144", 30, "Female", "Baridhara DOHS, Block B", "2024-02-25"),
  makePatient("KD-2024-036", "Shahjahan Mia", "+880 1677-889900", 55, "Male", "Lalbagh, Rujina Para", "2023-11-15"),
  makePatient("KD-2024-108", "Nusrat Jahan", "+880 1799-001122", 25, "Female", "Bashundhara Residential Area", "2024-03-01", false),
  makePatient("KD-2024-019", "Kamal Hossain", "+880 1520-334455", 61, "Male", "Maghbazar, Malibag Railgate", "2023-10-30"),
  makePatient("KD-2024-133", "Tahmina Chowdhury", "+880 1712-331166", 40, "Female", "Gulshan 1, Road 53", "2024-03-13"),
  makePatient("KD-2024-067", "Mohiuddin Ahmed", "+880 1900-554477", 49, "Male", "Jigatola, Zoo Road", "2024-01-31"),
  makePatient("KD-2024-125", "Nafisa Tahsin", "+880 1699-665500", 26, "Female", "Bashundhara R/A, Block F", "2024-03-11"),
  makePatient("KD-2024-042", "Nazia Roksana", "+880 1788-442200", 34, "Female", "Siddheshwari, Panthapath", "2024-02-01", false),
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}