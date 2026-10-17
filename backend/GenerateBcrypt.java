import java.io.Console;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateBcrypt {
    public static void main(String[] args) throws Exception {
        Console console = System.console();
        if (console == null) {
            throw new IllegalStateException(
                "Ruleaza comanda intr-o fereastra PowerShell interactiva."
            );
        }

        char[] password = console.readPassword("Alege parola demo: ");
        char[] confirm = console.readPassword("Repeta parola demo: ");

        try {
            if (!java.util.Arrays.equals(password, confirm)) {
                throw new IllegalArgumentException("Parolele nu coincid.");
            }

            String raw = new String(password);
            String hash = new BCryptPasswordEncoder(12).encode(raw);

            Files.writeString(Path.of("demo-password-bcrypt.txt"), hash);
            System.out.println("Hash-ul a fost salvat in demo-password-bcrypt.txt");
        } finally {
            java.util.Arrays.fill(password, '\0');
            java.util.Arrays.fill(confirm, '\0');
        }
    }
}
