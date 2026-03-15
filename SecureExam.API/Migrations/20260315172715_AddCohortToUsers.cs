using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecureExam.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCohortToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cohort",
                table: "Users",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cohort",
                table: "Users");
        }
    }
}
